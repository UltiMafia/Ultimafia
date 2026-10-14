// Keeping User.email in step with the Firebase account's email after the
// user changes it (Firebase verifyBeforeUpdateEmail: the change only happens
// once the new address is verified).

function normalizeEmail(email) {
  return typeof email === "string" ? email.trim().toLowerCase() : "";
}

// Decides how a user's stored emails change for a verified Firebase token.
//   user           { fbUid, email: [String] }
//   claims         verified ID token claims ({ uid, email, email_verified })
//   allowedDomains EMAIL_DOMAINS
//   takenByOther   true if another account already has the new email
//   oldEmail       optional: the address being replaced (dropped if stored)
// Returns { ok: true, changed, email, emails } or { ok: false, error }.
function planEmailSync({ user, claims, allowedDomains, takenByOther, oldEmail }) {
  if (!user || !claims) return { ok: false, error: "Not signed in." };
  if (claims.email_verified !== true)
    return { ok: false, error: "The new email address is not verified yet." };
  if (!user.fbUid || claims.uid !== user.fbUid)
    return { ok: false, error: "That sign-in belongs to a different account." };

  const email = normalizeEmail(claims.email);
  if (!email || !email.includes("@"))
    return { ok: false, error: "No email address on that sign-in." };

  const stored = Array.isArray(user.email) ? user.email : [];
  if (stored.some((e) => normalizeEmail(e) === email))
    return { ok: true, changed: false, email, emails: stored };

  const domain = email.split("@")[1];
  if (!(allowedDomains || []).includes(domain))
    return { ok: false, error: "That email domain is not allowed." };
  if (takenByOther)
    return { ok: false, error: "That email address is used by another account." };

  const old = normalizeEmail(oldEmail);
  const emails = [email, ...stored.filter((e) => !old || normalizeEmail(e) !== old)];
  return { ok: true, changed: true, email, emails };
}

module.exports = { normalizeEmail, planEmailSync };
