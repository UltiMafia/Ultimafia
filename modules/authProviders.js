// Which Firebase sign-in provider a verified ID token came from, and the
// sign-up email domain rules that depend on it.

// Sign in with Apple's "Hide My Email" relay. Apple verifies these addresses
// and forwards mail to the user's real inbox.
const APPLE_RELAY_DOMAIN = "privaterelay.appleid.com";

function signInProvider(tokenClaims) {
  return (tokenClaims && tokenClaims.firebase && tokenClaims.firebase.sign_in_provider) || "";
}

function emailDomain(email) {
  return String(email || "").split("@")[1]?.toLowerCase() || "";
}

function isAppleRelayEmail(email) {
  return emailDomain(email) === APPLE_RELAY_DOMAIN;
}

// New accounts need an allowed email domain (EMAIL_DOMAINS). An Apple relay
// address is allowed only when the token itself is an Apple sign-in.
function isAllowedSignupEmail(email, provider, allowedDomains) {
  const domain = emailDomain(email);
  if (!domain) return false;
  if ((allowedDomains || []).includes(domain)) return true;
  return provider === "apple.com" && domain === APPLE_RELAY_DOMAIN;
}

module.exports = {
  APPLE_RELAY_DOMAIN,
  signInProvider,
  isAppleRelayEmail,
  isAllowedSignupEmail,
};
