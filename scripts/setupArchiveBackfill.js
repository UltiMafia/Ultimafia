/**
 * Idempotent backfill for the setup archive (UltiMafia#2766).
 *
 * Steps:
 *  0. Seed SetupArchivistBot.
 *  1. Ensure indexes {archived:1}, {archived:1, played:1, lastPlayedAt:1},
 *     {originalCreator:1}.
 *  2. Set lastPlayedAt from the latest finished Game (endTime > 0), else updatedAt.
 *  3. Setups whose creator is a deleted user → transfer + archive
 *     (archivedReason ownerDeleted, history reason backfillDeleted).
 *  4. Setups moved to SetupArchivist (uBqs8KaDx) by an "Archive Setup" mod
 *     action → move to SetupArchivistBot and archive. originalCreator stays
 *     unset. Curated setups on that account are left public.
 *  5. --rollback unarchives and reverses history reasons backfillDeleted and
 *     backfill2706. Nothing is deleted. A second rollback is a no-op.
 *
 * Usage:
 *   node scripts/setupArchiveBackfill.js [--dry-run] [--rollback]
 *     [--batch=200] [--since=YYYY-MM-DD]
 *
 * Does not connect unless it is the main module. run() may be given
 * onlyIds to limit which setup ids are written.
 */

const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });

const models = require("../db/models");
const constants = require("../data/constants");

const BOT_ID = constants.SETUP_ARCHIVIST_BOT_ID;
const LEGACY_ARCHIVIST_ID = "uBqs8KaDx";
const BACKFILL_REASONS = ["backfillDeleted", "backfill2706"];
const INDEXES = [
  { archived: 1 },
  { archived: 1, played: 1, lastPlayedAt: 1 },
  { originalCreator: 1 },
];

function parseArgs(argv) {
  const opts = {
    dryRun: false,
    rollback: false,
    batch: 200,
    since: null,
    onlyIds: null,
  };
  for (const arg of argv || []) {
    if (arg === "--dry-run") opts.dryRun = true;
    else if (arg === "--rollback") opts.rollback = true;
    else if (arg.indexOf("--batch=") === 0) {
      const size = Number(arg.slice("--batch=".length));
      if (size > 0) opts.batch = size;
    } else if (arg.indexOf("--since=") === 0) {
      const raw = arg.slice("--since=".length);
      const numeric = Number(raw);
      opts.since =
        String(numeric) === raw && Number.isFinite(numeric)
          ? numeric
          : Date.parse(raw);
    }
  }
  return opts;
}

function idFilter(options) {
  if (!options.onlyIds || !options.onlyIds.length) return {};
  return { id: { $in: options.onlyIds } };
}

function archiveApi() {
  return require("../modules/setupArchive");
}

async function forEachBatch(query, batch, select, fn) {
  let lastId = null;
  const size = batch > 0 ? batch : 200;
  for (;;) {
    const page = Object.assign({}, query);
    if (lastId) page._id = { $gt: lastId };
    const docs = await models.Setup.find(page)
      .select(select)
      .sort({ _id: 1 })
      .limit(size)
      .lean();
    if (!docs.length) break;
    await fn(docs);
    lastId = docs[docs.length - 1]._id;
    if (docs.length < size) break;
  }
}

async function ensureSeed(options, report) {
  const existing = await models.User.findOne({ id: BOT_ID }).select("_id id").lean();
  if (options.dryRun) {
    report.seeded = { created: false, wouldCreate: !existing, id: BOT_ID };
    return existing;
  }
  const migrate = require("../migrations/seedSetupArchivistBot");
  report.seeded = await migrate();
  return models.User.findOne({ id: BOT_ID }).select("_id id").lean();
}

async function ensureIndexes(options) {
  if (!options.dryRun) {
    for (const spec of INDEXES) {
      await models.Setup.collection.createIndex(spec);
    }
  }
  return { ensured: !options.dryRun, specs: INDEXES };
}

async function latestPlay(setupIds) {
  const map = new Map();
  if (!setupIds.length) return map;
  const rows = await models.Game.aggregate([
    { $match: { setup: { $in: setupIds }, endTime: { $gt: 0 } } },
    { $group: { _id: "$setup", last: { $max: "$endTime" } } },
  ]);
  for (const row of rows) map.set(String(row._id), row.last);
  return map;
}

async function backfillLastPlayed(options) {
  let updated = 0;
  await forEachBatch(
    idFilter(options),
    options.batch,
    "_id updatedAt lastPlayedAt",
    async (docs) => {
      const plays = await latestPlay(docs.map((doc) => doc._id));
      for (const setup of docs) {
        const fromGame = plays.get(String(setup._id));
        const desired = fromGame != null ? fromGame : setup.updatedAt;
        if (desired == null || desired === "") continue;
        if (
          setup.lastPlayedAt != null &&
          Number(setup.lastPlayedAt) === Number(desired)
        ) {
          continue;
        }
        updated += 1;
        if (options.dryRun) continue;
        await models.Setup.updateOne(
          { _id: setup._id },
          { $set: { lastPlayedAt: desired } }
        ).exec();
      }
    }
  );
  return updated;
}

async function backfillDeletedCreators(options) {
  const deletedUsers = await models.User.find({ deleted: true }).select("_id").lean();
  const userIds = deletedUsers.map((user) => user._id);
  const result = { found: 0, transferred: 0 };
  if (!userIds.length) return result;

  const { transferToArchiveAccount, archiveSetups } = archiveApi();
  await forEachBatch(
    Object.assign({ creator: { $in: userIds } }, idFilter(options)),
    options.batch,
    "_id id creator originalCreator",
    async (docs) => {
      result.found += docs.length;
      if (options.dryRun) return;
      for (const setup of docs) {
        await transferToArchiveAccount(setup, null, "backfillDeleted");
        await archiveSetups([setup.id], "ownerDeleted", null);
        result.transferred += 1;
      }
    }
  );
  return result;
}

async function modActionSetupIds() {
  const actions = await models.ModAction.find({ name: "Archive Setup" })
    .select("args")
    .lean();
  const ids = new Set();
  for (const action of actions) {
    for (const arg of action.args || []) {
      if (arg) ids.add(String(arg));
    }
  }
  return ids;
}

async function backfillLegacy(options) {
  const allActionIds = await modActionSetupIds();
  let actionIds = [...allActionIds];
  if (options.onlyIds && options.onlyIds.length) {
    const allow = new Set(options.onlyIds.map(String));
    actionIds = actionIds.filter((id) => allow.has(id));
  }

  const legacy = await models.User.findOne({ id: LEGACY_ARCHIVIST_ID })
    .select("_id id")
    .lean();
  if (!legacy) {
    return {
      modActionSetups: actionIds.length,
      matched: 0,
      moved: 0,
      curatedLeft: 0,
      missingUser: true,
    };
  }

  const moving = await models.Setup.find({
    id: { $in: actionIds },
    creator: legacy._id,
  })
    .select("_id id creator originalCreator")
    .lean();

  if (!options.dryRun) {
    const { transferToArchiveAccount, archiveSetups } = archiveApi();
    for (const setup of moving) {
      await transferToArchiveAccount(setup, null, "backfill2706", {
        leaveOriginalCreatorNull: true,
      });
      await archiveSetups([setup.id], "ownerDeleted", null);
    }
  }

  const curatedQuery = {
    creator: legacy._id,
    id: { $nin: [...allActionIds] },
  };
  if (options.onlyIds && options.onlyIds.length) {
    curatedQuery.id = { $in: options.onlyIds, $nin: [...allActionIds] };
  }
  const curatedLeft = await models.Setup.countDocuments(curatedQuery);

  return {
    modActionSetups: actionIds.length,
    matched: moving.length,
    moved: options.dryRun ? 0 : moving.length,
    curatedLeft,
  };
}

async function rollback(options, bot) {
  if (!bot) return 0;
  let count = 0;
  await forEachBatch(
    Object.assign(
      { "ownershipHistory.reason": { $in: BACKFILL_REASONS } },
      idFilter(options)
    ),
    options.batch,
    "_id id creator ownershipHistory",
    async (docs) => {
      for (const setup of docs) {
        const history = setup.ownershipHistory || [];
        const last = history[history.length - 1];
        if (!last || BACKFILL_REASONS.indexOf(last.reason) === -1) continue;
        if (options.since != null && !(Number(last.at) >= Number(options.since))) {
          continue;
        }
        if (String(setup.creator) !== String(bot._id)) continue;
        if (String(last.to) !== String(bot._id)) continue;
        if (!last.from) continue;
        count += 1;
        if (options.dryRun) continue;
        await models.User.updateOne(
          { _id: bot._id },
          { $pull: { setups: setup._id } }
        ).exec();
        await models.User.updateOne(
          { _id: last.from },
          { $addToSet: { setups: setup._id } }
        ).exec();
        await models.Setup.updateOne(
          { _id: setup._id },
          {
            $set: { creator: last.from, archived: false },
            $unset: { archivedAt: "", archivedBy: "", archivedReason: "" },
            $push: {
              ownershipHistory: {
                from: bot._id,
                to: last.from,
                at: Date.now(),
                reason: "rollback",
              },
            },
          }
        ).exec();
      }
    }
  );
  return count;
}

async function run(opts) {
  const options = Object.assign(
    { dryRun: false, rollback: false, batch: 200, since: null, onlyIds: null },
    opts || {}
  );
  const report = {
    dryRun: !!options.dryRun,
    rollback: !!options.rollback,
    seeded: null,
    indexes: null,
    lastPlayedAtUpdated: 0,
    deletedCreators: { found: 0, transferred: 0 },
    legacyArchivist: {
      modActionSetups: 0,
      matched: 0,
      moved: 0,
      curatedLeft: 0,
    },
    rolledBack: 0,
  };

  if (options.rollback) {
    const bot = await ensureSeed(options, report);
    report.rolledBack = await rollback(options, bot);
    return report;
  }

  await ensureSeed(options, report);
  report.indexes = await ensureIndexes(options);
  report.lastPlayedAtUpdated = await backfillLastPlayed(options);
  report.deletedCreators = await backfillDeletedCreators(options);
  report.legacyArchivist = await backfillLegacy(options);
  return report;
}

if (require.main === module) {
  const db = require("../db/db");
  db.promise
    .then(() => run(parseArgs(process.argv.slice(2))))
    .then((result) => {
      console.log(JSON.stringify(result, null, 2));
      process.exit(0);
    })
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}

module.exports = { run, parseArgs };
