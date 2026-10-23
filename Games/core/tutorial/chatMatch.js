// Lenient parsing of a tutorial player's chat: which roles, player names and
// verdicts (guilty / innocent) a message mentions. Used to check a scripted
// claim or report and to pick how the bots react when it's off.

const ROLE_WORDS = {
  cop: ["cop", "cops", "police", "detective", "investigator", "inv"],
  sheriff: ["sheriff", "gun", "gunner"],
  journalist: ["journalist", "journo", "reporter"],
  villager: ["villager", "vanilla", "vt", "townie", "villa"],
  janitor: ["janitor", "jan", "jani"],
  lawyer: ["lawyer", "attorney"],
  mafioso: ["mafioso"],
};

function words(text) {
  return String(text || "")
    .toLowerCase()
    .replace(/[^a-z0-9' ]+/g, " ")
    .split(/\s+/)
    .filter(Boolean);
}

function mentionedRoles(text) {
  const w = new Set(words(text));
  return Object.keys(ROLE_WORDS).filter((role) =>
    ROLE_WORDS[role].some((word) => w.has(word))
  );
}

// A name counts if a word equals it or is a prefix of it at least 3 letters
// long ("cass" for Cassidy), allowing one typo on names of 5+ letters.
function nameMatches(word, name) {
  name = name.toLowerCase();
  if (word === name) return true;
  if (word.length >= 3 && name.startsWith(word)) return true;
  if (name.length >= 5 && Math.abs(word.length - name.length) <= 1)
    return editDistance(word, name) <= 1;
  return false;
}

function editDistance(a, b) {
  const d = Array.from({ length: a.length + 1 }, (_, i) => [i]);
  for (let j = 1; j <= b.length; j++) d[0][j] = j;
  for (let i = 1; i <= a.length; i++)
    for (let j = 1; j <= b.length; j++)
      d[i][j] = Math.min(
        d[i - 1][j] + 1,
        d[i][j - 1] + 1,
        d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)
      );
  return d[a.length][b.length];
}

function mentionedNames(text, names) {
  const w = words(text);
  return names.filter((name) => w.some((word) => nameMatches(word, name)));
}

function verdictOf(text) {
  const t = " " + words(text).join(" ") + " ";
  if (/ (not guilty|not maf|not mafia|not evil|not scum|innocent|inno|clear|cleared|good|safe) /.test(t))
    return "innocent";
  if (/ (guilty|maf|mafia|scum|evil|red|bad) /.test(t)) return "guilty";
  return null;
}

// expect: { role?, target?, verdict? } (target is a display name)
// Returns { ok, problem } where problem is one of
// "wrongRole" | "wrongTarget" | "wrongVerdict" | "incomplete" | null.
function evaluate(text, expect, names) {
  const roles = mentionedRoles(text);
  // Don't treat the target's name as a role word ("jan" in "Janet").
  const named = mentionedNames(text, names);
  const verdict = verdictOf(text);

  if (expect.role && roles.length && !roles.includes(expect.role))
    return { ok: false, problem: "wrongRole", roles, named, verdict };
  if (expect.target && named.length && !named.includes(expect.target))
    return { ok: false, problem: "wrongTarget", roles, named, verdict };
  if (expect.verdict && verdict && verdict !== expect.verdict)
    return { ok: false, problem: "wrongVerdict", roles, named, verdict };

  const missing =
    (expect.role && !roles.includes(expect.role)) ||
    (expect.target && !named.includes(expect.target)) ||
    (expect.verdict && verdict !== expect.verdict);
  if (missing) return { ok: false, problem: "incomplete", roles, named, verdict };
  return { ok: true, problem: null, roles, named, verdict };
}

module.exports = { evaluate, mentionedRoles, mentionedNames, verdictOf, words };
