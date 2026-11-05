// Login gate for the device fingerprint.
//
// Bans are matched against `fingerprint.stable`, so a browser that refuses to
// produce one silently turns every ban into an allow: the request carries no
// print, nothing matches, and the login succeeds. A client-side refusal is a
// deterrent, not a proof — a technical user can send a fabricated print — but
// it makes the ordinary "private window" bypass stop working.
//
// A missing print is not always deliberate: an insecure origin has no
// crypto.subtle at all, so collection returns null on plain http. Gating that
// would break self-hosted http installs and local development, so the gate only
// applies to secure origins. On https a missing print means the browser
// withheld it (private mode, Brave Shields fingerprint blocking, an extension,
// or an environment with canvas disabled).

const FINGERPRINT_BLOCK_TITLE = "This browser couldn't be verified";

const FINGERPRINT_BLOCK_BODY =
  "Ultimafia checks a device fingerprint at login so banned accounts cannot " +
  "simply come back. Private windows and fingerprint-blocking settings (Brave " +
  "Shields, for example) stop that check, so sign-in is blocked here. Open the " +
  "site in a normal window, allow fingerprinting for this site, then reload.";

function isFingerprintMissing(fingerprint) {
  return (
    !fingerprint ||
    typeof fingerprint !== "object" ||
    typeof fingerprint.stable !== "string" ||
    fingerprint.stable.length === 0
  );
}

function isSecureOrigin() {
  return typeof window !== "undefined" && Boolean(window.isSecureContext);
}

function shouldBlockForFingerprint(fingerprint, secureContext) {
  const secure =
    secureContext === undefined ? isSecureOrigin() : Boolean(secureContext);
  if (!secure) return false;
  return isFingerprintMissing(fingerprint);
}

export {
  FINGERPRINT_BLOCK_TITLE,
  FINGERPRINT_BLOCK_BODY,
  isFingerprintMissing,
  shouldBlockForFingerprint,
};
