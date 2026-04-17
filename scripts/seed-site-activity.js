/**
 * Seeds synthetic site activity so the admin Site Activity dashboard has
 * something to display in dev. Run inside the backend container:
 *
 *   docker exec backend node scripts/seed-site-activity.js
 *
 * Events are spread across the last 30 days (weighted toward the last 24h)
 * so all three window options (24h / 7d / 30d) show meaningfully different
 * counts.
 */

require("dotenv").config();
const db = require("../db/db");
const models = require("../db/models");
const shortid = require("shortid");
const mongoose = require("mongoose");

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pick(arr) {
  return arr[randInt(0, arr.length - 1)];
}

// Timestamp within the last `days` days, biased toward recent.
function pastTs(days) {
  const r = Math.pow(Math.random(), 1.8); // bias toward 0 -> recent
  return Date.now() - Math.floor(r * days * 24 * 3600 * 1000);
}

const FAKE_NAMES = [
  "ghostnight",
  "darwinthedog",
  "hexagoner",
  "melon_runner",
  "quietsand",
  "captain_vex",
  "rosepetal",
  "toastyroast",
  "lunaris",
  "wickerbell",
];

const GAME_TYPES = ["Mafia", "Resistance", "SecretDictator", "TexasHoldEm", "ConnectFour"];
const MOD_ACTIONS = ["ban", "unban", "awardTrophy", "deleteSetup", "featureSetup"];
const COMMENT_LOCATIONS = (existingUserIds, existingSetupIds) => [
  { w: 3, loc: () => `setup/${pick(existingSetupIds)}` },
  { w: 2, loc: () => `role/${pick(["Accountant", "Detective", "Agent", "Cop"])}` },
  { w: 2, loc: () => pick(existingUserIds) },
  { w: 1, loc: () => "lobby" },
];

function weightedPick(items) {
  const total = items.reduce((acc, x) => acc + x.w, 0);
  let r = Math.random() * total;
  for (const it of items) {
    r -= it.w;
    if (r <= 0) return it;
  }
  return items[items.length - 1];
}

async function main() {
  await db.promise;
  console.log("Connected to Mongo. Seeding…");

  // 1. Create some fake users if we don't already have them.
  const existingCount = await models.User.countDocuments();
  const targetUsers = 8;
  const newUserIds = [];
  if (existingCount < targetUsers) {
    for (let i = 0; i < targetUsers - existingCount; i++) {
      const id = shortid.generate();
      const name = `${pick(FAKE_NAMES)}${randInt(10, 999)}`;
      const u = new models.User({
        id,
        name,
        email: `${id}@seed.local`,
        fbUid: `seed-${id}`,
        joined: pastTs(30),
        lastActive: pastTs(2),
        avatar: false,
        flagged: false,
        banned: false,
      });
      await u.save();
      newUserIds.push(id);
    }
    console.log(`Inserted ${newUserIds.length} fake users.`);
  }

  const allUsers = await models.User.find({}).select("id _id").lean();
  const userIds = allUsers.map((u) => u.id);
  const userObjectIds = allUsers.map((u) => u._id);

  // 2. Games. Need setup references — grab existing ones.
  const setups = await models.Setup.find({}).select("_id id name").lean();
  if (setups.length === 0) {
    console.log("No setups exist; skipping game insertion.");
  } else {
    const gameOps = [];
    for (let i = 0; i < 35; i++) {
      const start = pastTs(30);
      gameOps.push({
        id: shortid.generate(),
        type: pick(GAME_TYPES),
        setup: pick(setups)._id,
        users: [pick(userObjectIds)],
        players: [pick(userIds)],
        names: [],
        startTime: start,
        endTime: start + randInt(5, 40) * 60 * 1000,
        ranked: Math.random() < 0.4,
        competitive: Math.random() < 0.1,
        lobby: pick(["Main", "Sandbox", "Games"]),
        winners: [],
        hadVeg: Math.random() < 0.1,
      });
    }
    await models.Game.insertMany(gameOps);
    console.log(`Inserted ${gameOps.length} games.`);
  }

  // 3. A poll + votes.
  const pollId = shortid.generate();
  const pollDoc = new models.Poll({
    id: pollId,
    name: "Seeded dev poll",
    description: "Synthetic poll for dashboard seeding",
    options: ["Alpha", "Beta", "Gamma"],
    createdAt: pastTs(7),
  });
  await pollDoc.save();
  const voteDocs = [];
  for (let i = 0; i < 12; i++) {
    voteDocs.push({
      pollId,
      userId: pick(userIds),
      optionIndex: randInt(0, 2),
      votedAt: pastTs(5),
    });
  }
  await models.PollVote.insertMany(voteDocs);
  console.log(`Inserted 1 poll + ${voteDocs.length} poll votes.`);

  // 4. Stamp trades.
  // StampTrade has unique indexes on initiatorStamp and recipientStamp that
  // reject multiple documents with null values, so we provide fresh ObjectIds
  // for each row (they don't need to reference real Stamp docs for the
  // dashboard feed — only the timestamps and status are rendered).
  const stampOps = [];
  for (let i = 0; i < 6; i++) {
    const ts = pastTs(14);
    stampOps.push({
      id: shortid.generate(),
      initiatorId: pick(userIds),
      recipientId: pick(userIds),
      initiatorStamp: new mongoose.Types.ObjectId(),
      recipientStamp: new mongoose.Types.ObjectId(),
      status: pick(["PENDING_RESPONSE", "PENDING_CONFIRMATION", "COMPLETED", "REJECTED"]),
      createdAt: ts,
      updatedAt: ts + randInt(1, 60) * 60 * 1000,
      completedAt: null,
    });
  }
  await models.StampTrade.insertMany(stampOps);
  console.log(`Inserted ${stampOps.length} stamp trades.`);

  // 5. Trophy awards.
  const trophyOps = [];
  for (let i = 0; i < 4; i++) {
    trophyOps.push({
      id: shortid.generate(),
      name: pick(["Champion", "MVP", "First Blood"]),
      ownerId: pick(userIds),
      createdBy: pick(userIds),
      createdAt: pastTs(20),
    });
  }
  await models.Trophy.insertMany(trophyOps);
  console.log(`Inserted ${trophyOps.length} trophies.`);

  // 6. ModActions.
  const modOps = [];
  for (let i = 0; i < 8; i++) {
    modOps.push({
      id: shortid.generate(),
      modId: pick(userIds),
      name: pick(MOD_ACTIONS),
      args: [pick(userIds)],
      reason: pick([
        "Seeded reason",
        "Routine check",
        "User report followup",
        "",
      ]),
      date: pastTs(10),
    });
  }
  await models.ModAction.insertMany(modOps);
  console.log(`Inserted ${modOps.length} mod actions.`);

  // 7. Reports.
  const reportOps = [];
  for (let i = 0; i < 5; i++) {
    const ts = pastTs(15);
    reportOps.push({
      id: shortid.generate(),
      reporterId: pick(userIds),
      reportedUserId: pick(userIds),
      status: pick(["open", "in-progress", "complete", "appealed"]),
      history: [],
      createdAt: ts,
      updatedAt: ts,
    });
  }
  await models.Report.insertMany(reportOps);
  console.log(`Inserted ${reportOps.length} reports.`);

  // 8. Comments across locations.
  const locFactory = COMMENT_LOCATIONS(
    userIds,
    setups.map((s) => s.id)
  );
  const commentOps = [];
  const sampleTexts = [
    "Love this setup, classic gameplay.",
    "Anyone up for a ranked game?",
    "Tried this last night, very balanced.",
    "Couldn't enact the policy, possible bug?",
    "Great art on this role.",
    "What is the win rate for village here?",
  ];
  for (let i = 0; i < 18; i++) {
    const picked = weightedPick(locFactory);
    commentOps.push({
      id: shortid.generate(),
      author: pick(userObjectIds),
      location: picked.loc(),
      content: pick(sampleTexts),
      date: pastTs(7),
      voteCount: randInt(0, 4),
      deleted: false,
      pending: false,
    });
  }
  await models.Comment.insertMany(commentOps);
  console.log(`Inserted ${commentOps.length} comments.`);

  // 9. ForumVotes. ObjectId timestamps are baked in on insert, so we create
  // ObjectIds from explicit timestamps so they are spread across the window.
  const voteRows = [];
  const THREAD_IDS = (await models.ForumThread.find({}).select("_id").lean())
    .map((t) => t._id.toString())
    .slice(0, 5);
  const itemTargets = [
    ...THREAD_IDS,
    ...setups.map((s) => s.id),
    "Mafia:Accountant",
    "Mafia:Agent",
  ];
  for (let i = 0; i < 30; i++) {
    const ts = pastTs(7);
    const oid = mongoose.Types.ObjectId.createFromTime(Math.floor(ts / 1000));
    voteRows.push({
      _id: oid,
      voter: pick(userIds),
      item: pick(itemTargets),
      direction: Math.random() < 0.8 ? 1 : -1,
    });
  }
  await models.ForumVote.insertMany(voteRows);
  console.log(`Inserted ${voteRows.length} forum votes.`);

  // 10. SiteActivity events.
  const activityOps = [];
  for (let i = 0; i < 40; i++) {
    const t = weightedPick([
      { w: 8, type: "login" },
      { w: 2, type: "avatarChange" },
      { w: 2, type: "nameChange" },
      { w: 2, type: "deckCreate" },
      { w: 1, type: "settingsChange" },
    ]);
    const meta =
      t.type === "nameChange"
        ? { oldName: pick(FAKE_NAMES), newName: pick(FAKE_NAMES) }
        : t.type === "deckCreate"
        ? { deckId: shortid.generate(), deckName: "Seeded deck" }
        : t.type === "settingsChange"
        ? { prop: pick(["showDeleted", "deathMessage", "youtube"]), newValue: "seed" }
        : undefined;
    activityOps.push({
      id: shortid.generate(),
      type: t.type,
      actorId: pick(userIds),
      meta,
      date: pastTs(30),
    });
  }
  await models.SiteActivity.insertMany(activityOps);
  console.log(`Inserted ${activityOps.length} site activity events.`);

  console.log("Seeding complete.");
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
