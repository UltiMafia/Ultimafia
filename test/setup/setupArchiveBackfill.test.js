const chai = require("chai");
const should = chai.should();
const constants = require("../../data/constants");
const backfill = require("../../scripts/setupArchiveBackfill");

const BOT_ID = constants.SETUP_ARCHIVIST_BOT_ID;
const LEGACY_ID = "uBqs8KaDx";
const FIXTURE_IDS = [
  "bf2766-deleted",
  "bf2766-played",
  "bf2766-2706",
  "bf2766-curated",
];

let createdLegacy = false;

describe("setupArchiveBackfill args", function () {
  it("reads dry-run, rollback, batch, and since", function () {
    const opts = backfill.parseArgs([
      "--dry-run",
      "--rollback",
      "--batch=10",
      "--since=2020-01-01",
    ]);
    opts.dryRun.should.equal(true);
    opts.rollback.should.equal(true);
    opts.batch.should.equal(10);
    opts.since.should.equal(Date.parse("2020-01-01"));
    backfill.parseArgs(["--since=1700000000000"]).since.should.equal(1700000000000);
  });
});

describe("setupArchiveBackfill", function () {
  this.timeout(120000);

  let models;
  let deletedUser;
  let liveUser;
  let legacyUser;

  before(async function () {
    const db = require("../../db/db");
    models = require("../../db/models");
    await db.promise;
    await cleanup();
    await seedFixtures();
  });

  after(async function () {
    if (models) await cleanup();
  });

  async function cleanup() {
    const ours = await models.Setup.find({ id: /^bf2766-/ }).select("_id").lean();
    const oids = ours.map((doc) => doc._id);
    if (oids.length) {
      await models.User.updateMany(
        { setups: { $in: oids } },
        { $pull: { setups: { $in: oids } } }
      );
    }
    await models.Setup.deleteMany({ id: /^bf2766-/ });
    await models.Game.deleteMany({ id: /^bf2766-/ });
    await models.ModAction.deleteMany({ id: /^bf2766-/ });
    await models.User.deleteMany({
      $or: [
        { id: BOT_ID },
        { name: constants.SETUP_ARCHIVIST_BOT_NAME },
        { id: "bf2766-deleted" },
        { id: "bf2766-live" },
      ],
    });
    if (createdLegacy) {
      await models.User.deleteMany({ id: LEGACY_ID });
      createdLegacy = false;
    }
  }

  async function seedFixtures() {
    deletedUser = await models.User.create({
      id: "bf2766-deleted",
      name: "Bf2766 Deleted",
      deleted: true,
      setups: [],
    });
    liveUser = await models.User.create({
      id: "bf2766-live",
      name: "Bf2766 Live",
      deleted: false,
      setups: [],
    });
    legacyUser = await models.User.findOne({ id: LEGACY_ID });
    if (!legacyUser) {
      legacyUser = await models.User.create({
        id: LEGACY_ID,
        name: "SetupArchivist",
        deleted: false,
        setups: [],
      });
      createdLegacy = true;
    } else if (legacyUser.deleted) {
      await models.User.updateOne(
        { _id: legacyUser._id },
        { $set: { deleted: false } }
      );
      legacyUser.deleted = false;
    }

    const deletedSetup = await models.Setup.create({
      id: "bf2766-deleted",
      name: "Deleted owner",
      gameType: "Mafia",
      creator: deletedUser._id,
      played: 1,
      updatedAt: 1000,
    });
    const playedSetup = await models.Setup.create({
      id: "bf2766-played",
      name: "Played",
      gameType: "Mafia",
      creator: liveUser._id,
      played: 4,
      updatedAt: 1000,
      lastPlayedAt: 1000,
    });
    const legacySetup = await models.Setup.create({
      id: "bf2766-2706",
      name: "Moved by 2706",
      gameType: "Mafia",
      creator: legacyUser._id,
      played: 2,
      updatedAt: 50,
      lastPlayedAt: 50,
      ownershipHistory: [],
    });
    const curated = await models.Setup.create({
      id: "bf2766-curated",
      name: "Wolf Hunter",
      gameType: "Mafia",
      creator: legacyUser._id,
      played: 12,
      updatedAt: 50,
      lastPlayedAt: 50,
      ownershipHistory: [],
    });

    await models.User.updateOne(
      { _id: deletedUser._id },
      { $set: { setups: [deletedSetup._id] } }
    );
    await models.User.updateOne(
      { _id: liveUser._id },
      { $set: { setups: [playedSetup._id] } }
    );
    await models.User.updateOne(
      { _id: legacyUser._id },
      { $addToSet: { setups: { $each: [legacySetup._id, curated._id] } } }
    );

    await models.Game.create({
      id: "bf2766-open",
      type: "Mafia",
      setup: deletedSetup._id,
      endTime: 0,
    });
    await models.Game.create({
      id: "bf2766-old",
      type: "Mafia",
      setup: playedSetup._id,
      endTime: 1000,
    });
    await models.Game.create({
      id: "bf2766-new",
      type: "Mafia",
      setup: playedSetup._id,
      endTime: 9000,
    });
    await models.Game.create({
      id: "bf2766-unfinished",
      type: "Mafia",
      setup: playedSetup._id,
      endTime: 0,
    });
    await models.ModAction.create({
      id: "bf2766-action",
      modId: "bf2766-mod",
      name: "Archive Setup",
      args: ["bf2766-2706", "bf2766-missing"],
      date: Date.now(),
    });
    await models.ModAction.create({
      id: "bf2766-other-action",
      modId: "bf2766-mod",
      name: "Delete Setup",
      args: ["bf2766-curated"],
      date: Date.now(),
    });
  }

  function options(extra) {
    return Object.assign({ batch: 1, onlyIds: FIXTURE_IDS.slice() }, extra);
  }

  async function load(id) {
    return models.Setup.findOne({ id }).lean();
  }

  it("is idempotent, leaves curated setups, and rolls back only its own transfers", async function () {
    const beforeIds = await models.Setup.countDocuments({ id: { $in: FIXTURE_IDS } });
    beforeIds.should.equal(4);
    const botBefore = await models.User.findOne({ id: BOT_ID }).select("_id").lean();
    should.not.exist(botBefore);

    const preview = await backfill.run(options({ dryRun: true }));
    preview.dryRun.should.equal(true);
    preview.seeded.wouldCreate.should.equal(true);
    preview.indexes.ensured.should.equal(false);
    preview.lastPlayedAtUpdated.should.equal(2);
    preview.deletedCreators.should.deep.equal({ found: 1, transferred: 0 });
    preview.legacyArchivist.modActionSetups.should.equal(1);
    preview.legacyArchivist.matched.should.equal(1);
    preview.legacyArchivist.moved.should.equal(0);
    preview.legacyArchivist.curatedLeft.should.equal(1);
    should.not.exist(await models.User.findOne({ id: BOT_ID }).select("_id").lean());
    String((await load("bf2766-2706")).creator).should.equal(String(legacyUser._id));
    should.not.exist((await load("bf2766-deleted")).lastPlayedAt);

    const first = await backfill.run(options());
    first.dryRun.should.equal(false);
    first.seeded.created.should.equal(true);
    first.indexes.ensured.should.equal(true);
    first.lastPlayedAtUpdated.should.equal(2);
    first.deletedCreators.should.deep.equal({ found: 1, transferred: 1 });
    first.legacyArchivist.moved.should.equal(1);
    first.legacyArchivist.curatedLeft.should.equal(1);

    const bot = await models.User.findOne({ id: BOT_ID }).lean();
    const deletedSetup = await load("bf2766-deleted");
    const played = await load("bf2766-played");
    const moved = await load("bf2766-2706");
    const curated = await load("bf2766-curated");

    deletedSetup.lastPlayedAt.should.equal(1000);
    String(deletedSetup.creator).should.equal(String(bot._id));
    String(deletedSetup.originalCreator).should.equal(String(deletedUser._id));
    deletedSetup.archived.should.equal(true);
    deletedSetup.archivedReason.should.equal("ownerDeleted");
    deletedSetup.ownershipHistory.should.have.lengthOf(1);
    deletedSetup.ownershipHistory[0].reason.should.equal("backfillDeleted");

    played.lastPlayedAt.should.equal(9000);
    String(played.creator).should.equal(String(liveUser._id));
    (played.archived === true).should.equal(false);

    String(moved.creator).should.equal(String(bot._id));
    should.not.exist(moved.originalCreator);
    moved.archived.should.equal(true);
    moved.archivedReason.should.equal("ownerDeleted");
    moved.ownershipHistory.should.have.lengthOf(1);
    moved.ownershipHistory[0].reason.should.equal("backfill2706");
    moved.lastPlayedAt.should.equal(50);

    String(curated.creator).should.equal(String(legacyUser._id));
    curated.name.should.equal("Wolf Hunter");
    (curated.archived === true).should.equal(false);
    (curated.ownershipHistory || []).should.have.lengthOf(0);

    const deletedOwner = await models.User.findOne({ id: "bf2766-deleted" }).lean();
    deletedOwner.setups.map(String).should.not.include(String(deletedSetup._id));
    bot.setups.map(String).should.include(String(deletedSetup._id));
    bot.setups.map(String).should.include(String(moved._id));
    const legacyNow = await models.User.findOne({ id: LEGACY_ID }).lean();
    legacyNow.setups.map(String).should.include(String(curated._id));
    legacyNow.setups.map(String).should.not.include(String(moved._id));

    const indexes = await models.Setup.collection.indexes();
    const keys = indexes.map((index) => JSON.stringify(index.key));
    keys.should.include(JSON.stringify({ originalCreator: 1 }));
    keys.should.include(
      JSON.stringify({ archived: 1, played: 1, lastPlayedAt: 1 })
    );

    const second = await backfill.run(options());
    second.seeded.created.should.equal(false);
    second.lastPlayedAtUpdated.should.equal(0);
    second.deletedCreators.should.deep.equal({ found: 0, transferred: 0 });
    second.legacyArchivist.matched.should.equal(0);
    second.legacyArchivist.moved.should.equal(0);
    (await load("bf2766-deleted")).ownershipHistory.should.have.lengthOf(1);
    (await load("bf2766-2706")).ownershipHistory.should.have.lengthOf(1);
    (await models.Setup.countDocuments({ id: { $in: FIXTURE_IDS } })).should.equal(4);

    const real = await models.Setup.create({
      id: "bf2766-real-delete",
      name: "Later account deletion",
      gameType: "Mafia",
      creator: bot._id,
      archived: true,
      archivedReason: "ownerDeleted",
      updatedAt: 50,
      lastPlayedAt: 50,
      ownershipHistory: [
        {
          from: deletedUser._id,
          to: bot._id,
          at: Date.now(),
          reason: "ownerDeleted",
        },
      ],
    });

    const rollbackIds = FIXTURE_IDS.concat("bf2766-real-delete");
    const dryRollback = await backfill.run(
      options({ rollback: true, dryRun: true, onlyIds: rollbackIds })
    );
    dryRollback.rolledBack.should.equal(2);
    (await load("bf2766-deleted")).ownershipHistory.should.have.lengthOf(1);
    (await load("bf2766-2706")).archived.should.equal(true);

    const future = await backfill.run(
      options({
        rollback: true,
        since: Date.now() + 60000,
        onlyIds: rollbackIds,
      })
    );
    future.rolledBack.should.equal(0);
    (await load("bf2766-2706")).ownershipHistory.should.have.lengthOf(1);

    const undone = await backfill.run(
      options({ rollback: true, onlyIds: rollbackIds })
    );
    undone.rolledBack.should.equal(2);

    const deletedAfter = await load("bf2766-deleted");
    const movedAfter = await load("bf2766-2706");
    const realAfter = await load("bf2766-real-delete");
    String(deletedAfter.creator).should.equal(String(deletedUser._id));
    deletedAfter.archived.should.equal(false);
    should.not.exist(deletedAfter.archivedReason);
    String(deletedAfter.originalCreator).should.equal(String(deletedUser._id));
    deletedAfter.ownershipHistory.should.have.lengthOf(2);
    deletedAfter.ownershipHistory[1].reason.should.equal("rollback");

    String(movedAfter.creator).should.equal(String(legacyUser._id));
    movedAfter.archived.should.equal(false);
    should.not.exist(movedAfter.originalCreator);
    movedAfter.ownershipHistory.should.have.lengthOf(2);
    movedAfter.ownershipHistory[1].reason.should.equal("rollback");

    String(realAfter.creator).should.equal(String(bot._id));
    realAfter.archived.should.equal(true);
    realAfter.archivedReason.should.equal("ownerDeleted");
    realAfter.ownershipHistory.should.have.lengthOf(1);
    realAfter.ownershipHistory[0].reason.should.equal("ownerDeleted");

    const deletedOwnerAfter = await models.User.findOne({ id: "bf2766-deleted" }).lean();
    deletedOwnerAfter.setups.map(String).should.include(String(deletedSetup._id));
    const botAfter = await models.User.findOne({ id: BOT_ID }).lean();
    botAfter.setups.map(String).should.not.include(String(deletedSetup._id));
    botAfter.setups.map(String).should.not.include(String(moved._id));
    const legacyAfter = await models.User.findOne({ id: LEGACY_ID }).lean();
    legacyAfter.setups.map(String).should.include(String(moved._id));
    legacyAfter.setups.map(String).should.include(String(curated._id));

    const again = await backfill.run(
      options({ rollback: true, onlyIds: rollbackIds })
    );
    again.rolledBack.should.equal(0);
    (await load("bf2766-deleted")).ownershipHistory.should.have.lengthOf(2);
    (await load("bf2766-2706")).ownershipHistory.should.have.lengthOf(2);
    (await models.Setup.countDocuments({ id: /^bf2766-/ })).should.equal(5);
    should.exist(real._id);
  });
});
