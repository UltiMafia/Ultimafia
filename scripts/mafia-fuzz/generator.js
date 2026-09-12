const roles = require("../../data/roles").Mafia;
const modifiers = require("../../data/modifiers").Mafia;
const { verifyRole } = require("../../modules/setupRoleValidation");

function random(seed) {
  let state = seed >>> 0;
  return () => {
    state += 0x6d2b79f5;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t ^= t + Math.imul(t ^ (t >>> 7), 61 | t);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function generate(seed, maxModifiers = 3) {
  const rng = random(seed);
  const pick = (xs) => xs[Math.floor(rng() * xs.length)];
  // Open, single-roleset setups. Events and Banished slots have different
  // player-count rules and are intentionally outside this initial corpus.
  const names = Object.keys(roles).filter(
    (name) => roles[name].alignment !== "Event" && verifyRole(name, "Mafia")
  );
  const mods = Object.keys(modifiers).filter((name) => name !== "Banished");
  const slots = ["Villager", "Villager", "Mafioso"];
  const total = 5 + Math.floor(rng() * 6);
  while (slots.length < total) {
    let role = pick(names);
    const count = Math.floor(rng() * (maxModifiers + 1));
    for (let i = 0; i < count; i++) {
      const candidate = role + (role.includes(":") ? "/" : ":") + pick(mods);
      if (verifyRole(candidate, "Mafia")) role = candidate;
    }
    slots.push(role);
  }
  const set = {};
  for (const role of slots) set[role] = (set[role] || 0) + 1;
  return { total, roles: [set], numMissions: 5, firstTeamSize: 2,
    lastTeamSize: 3, teamFailLimit: 5 };
}

function selections(info, meeting, rng) {
  if (!info.voting || !info.canVote || !info.canUpdateVote) return [];
  if (info.inputType === "text") return ["fuzz " + Math.floor(rng() * 100)];
  if (!Array.isArray(info.targets) || !info.targets.length) return [];
  const targets = info.targets.slice();
  for (let i = targets.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [targets[i], targets[j]] = [targets[j], targets[i]];
  }
  if (!info.multi) return targets.slice(0, 1);
  const max = Math.min(targets.length, meeting.multiMax);
  const min = Math.min(max, Math.max(1, meeting.multiMin));
  return targets.slice(0, min + Math.floor(rng() * (max - min + 1)));
}

module.exports = { random, generate, selections };
