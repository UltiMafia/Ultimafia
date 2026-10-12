const models = require("../db/models");

function splitEmail(email) {
  if (typeof email !== "string") return null;
  const trimmed = email.trim().toLowerCase();
  const parts = trimmed.split("@");
  if (parts.length !== 2 || !parts[0] || !parts[1]) return null;
  if (/\s/.test(trimmed) || !parts[1].includes(".")) return null;
  return { local: parts[0], domain: parts[1] };
}

function normalizeEmail(email) {
  const parsed = splitEmail(email);
  if (!parsed) return null;
  const gmail = parsed.domain === "gmail.com" || parsed.domain === "googlemail.com";
  let local = parsed.local.split("+")[0];
  if (gmail) local = local.replace(/\./g, "");
  if (!local) return null;
  return `${local}@${gmail ? "gmail.com" : parsed.domain}`;
}

function aliasRegex(email) {
  const parsed = splitEmail(email);
  const identity = normalizeEmail(email);
  if (!parsed || !identity) return null;
  const gmail = parsed.domain === "gmail.com" || parsed.domain === "googlemail.com";
  const local = identity.split("@")[0];
  const escaped = (char) => char.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const localPattern = gmail
    ? Array.from(local).map(escaped).join("\\.?")
    : escaped(local);
  const domainPattern = gmail ? "(?:gmail|googlemail)\\.com" : escaped(parsed.domain);
  return new RegExp(`^${localPattern}(?:\\+[^@]*)?@${domainPattern}$`, "i");
}

function isSameIdentity(a, b) {
  return normalizeEmail(a) === normalizeEmail(b);
}

async function findAliasAccount(email) {
  const regex = aliasRegex(email);
  if (!regex) return null;
  return models.User.findOne({ email: regex }).select("id email banned deleted");
}

module.exports = { splitEmail, normalizeEmail, aliasRegex, isSameIdentity, findAliasAccount };
