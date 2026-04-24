/**
 * Generic setupStats seeder for fortune payouts.
 *
 * Pulls rolePlays/roleWins + composition from the public setup API,
 * derives alignmentRows + roleRows, and writes them onto the current
 * SetupVersion (overwriting any existing rows).
 *
 * `played` on SetupVersion is legacy-inflated (includes unranked games
 * from before granular tracking); we ignore it and derive the ranked
 * game count N from rolePlays / composition-slots. Independents each
 * become their own alignment key (matching the per-setup seed scripts).
 *
 * Usage:
 *   node migrations/seedSetupStatsForFortune.js <SETUP_ID>
 *   node migrations/seedSetupStatsForFortune.js <SETUP_ID> --game-type competitive
 *   node migrations/seedSetupStatsForFortune.js <SETUP_ID> --dry-run
 *   node migrations/seedSetupStatsForFortune.js <SETUP_ID> --api-url https://...
 *
 * --dry-run prints the derived seed and exits without touching Mongo.
 */

require("dotenv").config();
const https = require("https");
const http = require("http");
const { URL } = require("url");
const mongoose = require("mongoose");
const mongo = require("mongodb");
const models = require("../db/models");
const roleData = require("../data/roles");
const logger = require("../modules/logging")("seedSetupStatsForFortune");

const ObjectID = mongo.ObjectID;
const DEFAULT_API_URL = "https://ultimafia.com/api";
const MAJOR_ALIGNMENTS = new Set(["Village", "Mafia", "Cult"]);

function parseArgs(argv) {
  const args = { setupId: null, gameType: "ranked", dryRun: false, apiUrl: DEFAULT_API_URL };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--dry-run") args.dryRun = true;
    else if (a === "--game-type") args.gameType = argv[++i];
    else if (a === "--api-url") args.apiUrl = argv[++i];
    else if (!a.startsWith("--") && !args.setupId) args.setupId = a;
    else throw new Error(`Unknown arg: ${a}`);
  }
  if (!args.setupId) throw new Error("Usage: seedSetupStatsForFortune.js <SETUP_ID> [--game-type ranked|competitive] [--dry-run] [--api-url URL]");
  if (!["ranked", "competitive"].includes(args.gameType)) {
    throw new Error(`Refusing gameType="${args.gameType}" — fortunePoints only counts "ranked" or "competitive".`);
  }
  return args;
}

function fetchJSON(url) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const client = u.protocol === "https:" ? https : http;
    const req = client.get(url, (res) => {
      if (res.statusCode !== 200) {
        res.resume();
        return reject(new Error(`HTTP ${res.statusCode} for ${url}`));
      }
      let body = "";
      res.setEncoding("utf8");
      res.on("data", (c) => (body += c));
      res.on("end", () => {
        try { resolve(JSON.parse(body)); }
        catch (e) { reject(new Error(`Invalid JSON from ${url}: ${e.message}`)); }
      });
    });
    req.on("error", reject);
    req.setTimeout(30000, () => req.destroy(new Error("timeout")));
  });
}

// composition string: "[{\"Granny:\":1,\"Templar:\":2,...}]" — array of role-groups,
// each group is a map of "RoleName:Modifier" -> count. For determining slots per
// game of a given role, we sum counts across groups for the bare role name.
function parseComposition(rolesJson) {
  const groups = JSON.parse(rolesJson);
  if (!Array.isArray(groups) || groups.length === 0) throw new Error("No role groups in setup.roles");
  const slots = {};
  for (const group of groups) {
    for (const rawKey of Object.keys(group)) {
      const bare = rawKey.split(":")[0];
      slots[bare] = (slots[bare] || 0) + group[rawKey];
    }
  }
  return { slots, groupCount: groups.length };
}

function alignmentKeyFor(roleName, gameType) {
  const gameRoles = roleData[gameType] || {};
  const entry = gameRoles[roleName];
  if (!entry) throw new Error(`Role "${roleName}" not found in data/roles.js[${gameType}]`);
  const a = entry.alignment;
  if (!a) throw new Error(`Role "${roleName}" has no alignment in data/roles.js`);
  return MAJOR_ALIGNMENTS.has(a) ? a : roleName;
}

function deriveSeeds({ slots, rolePlays, roleWins, gameType }) {
  // Drop composition entries that never appear in rolePlays — typically
  // suspended cards (e.g. "Flood:Suspended") that aren't playable roles.
  const allNames = Object.keys(slots);
  const roleNames = allNames.filter((r) => rolePlays[r] != null);
  const skipped = allNames.filter((r) => rolePlays[r] == null);
  if (skipped.length) {
    logger.warn(`Skipping composition entries with no rolePlays: ${skipped.join(", ")}`);
  }
  if (!roleNames.length) throw new Error("No playable roles in composition have rolePlays data.");

  // Derive N from rolePlays / slots — must be consistent across every role.
  let N = null;
  const nPerRole = {};
  for (const r of roleNames) {
    const plays = rolePlays[r];
    if (plays % slots[r] !== 0) throw new Error(`rolePlays[${r}]=${plays} not divisible by slots=${slots[r]}`);
    const candidate = plays / slots[r];
    nPerRole[r] = candidate;
    if (N == null) N = candidate;
    else if (candidate !== N) {
      throw new Error(
        `Inconsistent N across roles (variable composition?). ${JSON.stringify(nPerRole)}`
      );
    }
  }
  if (!N) throw new Error("No roles in composition");

  // Group roles by alignment key, then build ALIGNMENT_SEED + ROLE_SEED.
  const alignmentGroups = {}; // key -> { roles: [r], slotSum, winSum }
  for (const r of roleNames) {
    const key = alignmentKeyFor(r, gameType);
    const w = roleWins[r] || 0;
    if (!alignmentGroups[key]) alignmentGroups[key] = { roles: [], slotSum: 0, winSum: 0 };
    alignmentGroups[key].roles.push(r);
    alignmentGroups[key].slotSum += slots[r];
    alignmentGroups[key].winSum += w;
  }

  const alignmentSeed = [];
  for (const key of Object.keys(alignmentGroups)) {
    const g = alignmentGroups[key];
    if (g.winSum % g.slotSum !== 0) {
      logger.warn(
        `alignment "${key}" wins=${g.winSum} not divisible by slotSum=${g.slotSum} — ` +
          `roles in alignment may not always win together (e.g. conversions). Using floor().`
      );
    }
    const wins = Math.floor(g.winSum / g.slotSum);
    if (wins > N) throw new Error(`alignment "${key}" derived wins=${wins} > games=${N}`);
    alignmentSeed.push({ key, plays: N, wins });
  }

  const roleSeed = roleNames.map((r) => ({
    key: r,
    plays: rolePlays[r],
    wins: roleWins[r] || 0,
  }));

  return { N, alignmentSeed, roleSeed };
}

function buildRowsFromSeed(seed, gameType) {
  const rows = [];
  for (const entry of seed) {
    const losses = entry.plays - entry.wins;
    if (losses < 0) throw new Error(`Invalid seed "${entry.key}": wins>${entry.plays}`);
    for (let i = 0; i < entry.wins; i++) rows.push([entry.key, gameType, true]);
    for (let i = 0; i < losses; i++) rows.push([entry.key, gameType, false]);
  }
  return rows;
}

function summarize(seed) {
  return seed
    .map((e) => {
      const wr = e.plays ? ((e.wins / e.plays) * 100).toFixed(1) : "0.0";
      return `  ${e.key.padEnd(14)} ${String(e.wins).padStart(4)}/${String(e.plays).padEnd(5)} = ${wr}%`;
    })
    .join("\n");
}

function mongoConnectOptions() {
  const rawUrl = (process.env.MONGO_URL || "").trim();
  const hasScheme = /^mongodb(\+srv)?:\/\//i.test(rawUrl);

  if (hasScheme) {
    return {
      uri: rawUrl,
      options: {
        user: process.env.MONGO_USER,
        pass: process.env.MONGO_PW,
        useNewUrlParser: true,
        useUnifiedTopology: true,
      },
    };
  }

  const host = rawUrl || "localhost:27017";
  const dbName = process.env.MONGO_DB || "ultimafia";

  return {
    uri: `mongodb://${host}/${dbName}?authSource=admin`,
    options: {
      user: process.env.MONGO_USER,
      pass: process.env.MONGO_PW,
      useNewUrlParser: true,
      useUnifiedTopology: true,
    },
  };
}

async function main() {
  const args = parseArgs(process.argv);

  logger.info(`Fetching ${args.apiUrl}/setup/${args.setupId}`);
  const setup = await fetchJSON(`${args.apiUrl}/setup/${args.setupId}`);

  if (setup.gameType !== "Mafia") {
    throw new Error(`Unsupported gameType="${setup.gameType}" (fortunePoints only handles Mafia).`);
  }
  const sv = setup.setupVersion || {};
  const rolePlays = sv.rolePlays || {};
  const roleWins = sv.roleWins || {};
  if (!setup.roles) throw new Error(`setup.roles is empty on ${args.setupId}`);

  const { slots, groupCount } = parseComposition(setup.roles);
  if (groupCount > 1) {
    logger.warn(
      `Setup "${args.setupId}" has ${groupCount} role groups (multi-setup) — composition varies per game, ` +
        `so N cannot be auto-derived. Skipping; seed this one manually.`
    );
    process.exit(0);
  }

  const { N, alignmentSeed, roleSeed } = deriveSeeds({
    slots, rolePlays, roleWins, gameType: setup.gameType,
  });

  logger.info(`Setup "${setup.id}" (${setup.name || "?"}): derived N=${N} ranked games.`);
  logger.info(`Composition: ${Object.entries(slots).map(([r, n]) => `${r}×${n}`).join(", ")}`);
  logger.info(`Alignment seed:\n${summarize(alignmentSeed)}`);
  logger.info(`Role seed:\n${summarize(roleSeed)}`);

  const alignmentRows = buildRowsFromSeed(alignmentSeed, args.gameType);
  const roleRows = buildRowsFromSeed(roleSeed, args.gameType);
  logger.info(`Will write ${alignmentRows.length} alignmentRows and ${roleRows.length} roleRows (as ${args.gameType}).`);

  if (args.dryRun) {
    logger.info("--dry-run set; no DB connection, no write performed.");
    process.exit(0);
  }

  const { uri, options } = mongoConnectOptions();
  await mongoose.connect(uri, options);

  const setupDoc = await models.Setup.findOne({ id: args.setupId }).select("_id version").lean();
  if (!setupDoc) { logger.error(`Setup not found: ${args.setupId}`); process.exit(1); }

  const versionNum = setupDoc.version || 0;
  const svDoc = await models.SetupVersion.findOne({
    setup: new ObjectID(setupDoc._id),
    version: versionNum,
  }).select("_id version").lean();
  if (!svDoc) { logger.error(`SetupVersion not found for setup ${args.setupId} v${versionNum}`); process.exit(1); }

  logger.info(`Target: setup ${args.setupId} (${setupDoc._id}) SetupVersion ${svDoc._id} v${svDoc.version}`);

  const res = await models.SetupVersion.updateOne(
    { _id: svDoc._id },
    { $set: { "setupStats.alignmentRows": alignmentRows, "setupStats.roleRows": roleRows } }
  );
  logger.info(`Write complete. matched=${res.matchedCount} modified=${res.modifiedCount}`);
  process.exit(0);
}

main().catch((e) => {
  logger.error(e.stack || e.message || e);
  process.exit(1);
});
