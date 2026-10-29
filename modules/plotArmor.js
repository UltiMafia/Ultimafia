// Plot Armor: dev/QA-only protection for staff test accounts.
//
// PLOT_ARMOR_USER_IDS (server env, read once at startup) is a comma-separated
// list of user ids, parsed like BAN_APPEAL_VOTER_ALLOWLIST (trimmed, blanks
// skipped, exact match). Unset or empty: off, as in production. When set, the
// listed accounts are never banned because they are linked to someone else
// (shared IP or device fingerprint) or automatically:
// - the mod Ban "All linked accounts" cascade (routes/mod.js /ban);
// - the report-ruling cascade (routes/mod.js /reports/:id/complete);
// - the ban of a signed-in account that signs in to a banned account's email
//   (routes/auth.js authSuccess);
// and a linked Unban leaves their own bans alone. A new sign-up whose IP or
// device fingerprint is also used by an armored account (our own test network
// or devices) skips the sign-up ban-evasion checks (see
// sharesSignupEvidenceWithArmor).
// A ban that names an armored account directly as its target still applies,
// so staff can test banning one on purpose.
const { parseUserIdList } = require("../lib/userIdList");

const PLOT_ARMOR = parseUserIdList(process.env.PLOT_ARMOR_USER_IDS);

function isArmored(userId, armor = PLOT_ARMOR) {
  return !!armor && armor.has(userId);
}

// Splits the accounts a linked action would reach into the ones it acts on
// (kept) and the armored ones it skips. The directly targeted account is
// always kept, even when it is armored.
function splitArmored(userIds, targetId, armor = PLOT_ARMOR) {
  const kept = [];
  const skipped = [];
  for (const id of userIds) {
    if (id !== targetId && isArmored(id, armor)) skipped.push(id);
    else kept.push(id);
  }
  return { kept, skipped };
}

// Whether a new sign-up's IP, or its device (same platform and stable
// fingerprint), is also used by an armored account. routes/auth.js uses it to
// let sign-ups from the armored accounts' own network or devices skip the
// ban-evasion checks (banned-user IP, exact and partial banned fingerprint).
// A sign-up that matches a banned user but no armored account is still
// blocked or flagged as before. Always false when armor is off.
async function sharesSignupEvidenceWithArmor(
  { ip, fingerprint } = {},
  armor = PLOT_ARMOR
) {
  if (!armor) return false;
  const clauses = [];
  if (typeof ip === "string" && ip) clauses.push({ ip });
  if (fingerprint && fingerprint.platform && fingerprint.stable)
    clauses.push({
      fingerprints: {
        $elemMatch: {
          platform: fingerprint.platform,
          stable: fingerprint.stable,
        },
      },
    });
  if (clauses.length === 0) return false;
  // Loaded here so the env parsing above has no database dependency.
  const models = require("../db/models");
  return !!(await models.User.exists({
    id: { $in: [...armor] },
    $or: clauses,
  }));
}

// Mod log text when armor skipped linked accounts, else null.
function plotArmorLogNote(skipped) {
  const count = (skipped || []).length;
  if (!count) return null;
  return `Plot Armor: skipped ${count} linked account${count === 1 ? "" : "s"}`;
}

function plotArmorStartupWarning(armor = PLOT_ARMOR) {
  return armor
    ? `PLOT_ARMOR_USER_IDS is set: ${armor.size} account${
        armor.size === 1 ? " is" : "s are"
      } never banned through linked accounts or automatically, and sign-ups sharing their IP or device skip the ban-evasion checks. Dev/QA only, never set this in production.`
    : null;
}

module.exports = {
  isArmored,
  splitArmored,
  sharesSignupEvidenceWithArmor,
  plotArmorLogNote,
  plotArmorStartupWarning,
};
