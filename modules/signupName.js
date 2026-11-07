// Discord sign-up names.
//
// A Discord profile carries a display name, but it can be absent (accounts that
// never set one) or already taken on the site. Either way the new account needs
// a generated name. The absent case used to run `findOne({ name: undefined })`,
// which Mongoose turns into `{}` and so matches an arbitrary user, and the
// unused case dereferenced the null result — `Cannot read properties of null
// (reading 'id')` — which aborted the OAuth callback before the account was
// created, so the fingerprint/restriction path never ran.
function chooseSignupName({ displayName, nameTaken, generate, maxLength }) {
  const candidate = typeof displayName === "string" ? displayName.trim() : "";

  if (candidate && !nameTaken) return candidate;

  return String(generate()).slice(0, maxLength);
}

module.exports = { chooseSignupName };
