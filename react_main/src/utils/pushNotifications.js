import axios from "axios";

/**
 * Web push subscription helpers.
 *
 * Kept apart from the existing in-page `new Notification(...)` path rather than
 * replacing it: that path still works fine for a desktop user with the tab open
 * and no push subscription. What it cannot do is reach a phone whose browser is
 * backgrounded or closed, which is what this adds.
 */

const SERVICE_WORKER_URL = "/sw.js";

let configPromise = null;
let registrationPromise = null;

// Read by the in-page notification in Timer.jsx so a subscribed user does not get
// notified twice for the same event (once by the page, once by the push).
let activeSubscription = null;

export function hasActivePushSubscription() {
  return activeSubscription !== null;
}

export function isPushSupported() {
  return (
    typeof window !== "undefined" &&
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    typeof window.Notification !== "undefined"
  );
}

/**
 * iOS only delivers web push to a PWA that has been added to the home screen, and
 * only from iOS 16.4 on. In a plain Safari tab the subscribe call fails, so the
 * UI needs to tell the user to install rather than silently doing nothing.
 */
export function isStandalone() {
  if (typeof window === "undefined") return false;

  return Boolean(
    window.navigator.standalone === true ||
      window.matchMedia?.("(display-mode: standalone)").matches
  );
}

export function isIos() {
  if (typeof navigator === "undefined") return false;

  return (
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    // iPadOS 13+ reports as a Mac; the touch point check separates it out.
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
  );
}

/** True when we can ask at all: supported, and on iOS only once installed. */
export function canRequestPush() {
  if (!isPushSupported()) return false;
  if (isIos() && !isStandalone()) return false;
  return true;
}

export function getPermission() {
  if (typeof window === "undefined" || !window.Notification) return "denied";
  return window.Notification.permission;
}

/**
 * Whether the server can actually deliver a push. False when it has no VAPID
 * keys configured, in which case the UI must not offer notifications at all --
 * otherwise the button is dead on arrival.
 */
export async function isPushEnabledOnServer() {
  const config = await getPushConfig();
  return Boolean(config.enabled && config.publicKey);
}

async function getPushConfig() {
  if (!configPromise) {
    configPromise = axios
      .get("/api/site/push-config")
      .then((res) => res.data)
      .catch(() => ({ enabled: false, publicKey: "" }));
  }

  return configPromise;
}

/**
 * The VAPID key is base64url; PushManager wants raw bytes.
 */
function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = window.atob(base64);

  const output = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) output[i] = raw.charCodeAt(i);
  return output;
}

export async function registerServiceWorker() {
  if (!isPushSupported()) return null;

  if (!registrationPromise) {
    registrationPromise = navigator.serviceWorker
      .register(SERVICE_WORKER_URL, { scope: "/" })
      .then(() => navigator.serviceWorker.ready)
      .catch((e) => {
        console.warn("Service worker registration failed:", e);
        registrationPromise = null;
        return null;
      });
  }

  return registrationPromise;
}

/**
 * Subscribe, returning the subscription as a plain object ready to send to the
 * server, or null if push is unavailable, unconfigured, or refused.
 *
 * Must be called from a user gesture on iOS: Safari only honours
 * Notification.requestPermission() during user activation.
 */
export async function subscribeToPush() {
  if (!canRequestPush()) return null;

  const config = await getPushConfig();
  if (!config.enabled || !config.publicKey) return null;

  const registration = await registerServiceWorker();
  if (!registration) return null;

  let permission = getPermission();
  if (permission === "default") {
    permission = await window.Notification.requestPermission();
  }
  if (permission !== "granted") return null;

  try {
    // Reuse an existing subscription when there is one; re-subscribing with a
    // different applicationServerKey throws, so drop a mismatched one first.
    let subscription = await registration.pushManager.getSubscription();

    if (subscription) {
      const existingKey = subscription.options?.applicationServerKey;
      const wantedKey = urlBase64ToUint8Array(config.publicKey);

      if (existingKey && !keysMatch(existingKey, wantedKey)) {
        await subscription.unsubscribe();
        subscription = null;
      }
    }

    if (!subscription) {
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(config.publicKey),
      });
    }

    activeSubscription = subscription;
    return subscription.toJSON();
  } catch (e) {
    console.warn("Push subscribe failed:", e);
    return null;
  }
}

function keysMatch(existing, wanted) {
  const a = new Uint8Array(existing);
  if (a.length !== wanted.length) return false;
  return a.every((byte, i) => byte === wanted[i]);
}

/**
 * Returns the endpoint that was dropped so the caller can tell the server which
 * target to forget, or null if there was nothing to unsubscribe.
 */
export async function unsubscribeFromPush() {
  const subscription = activeSubscription;
  activeSubscription = null;

  if (!subscription) return null;

  const { endpoint } = subscription;

  try {
    await subscription.unsubscribe();
  } catch (e) {
    // Already gone, or the browser cleared it. The server prunes on its own when
    // the push service reports the endpoint as expired, so this is not fatal.
  }

  return endpoint;
}

/** Forget the local handle without revoking the browser subscription. */
export function releaseSubscription() {
  const endpoint = activeSubscription?.endpoint || null;
  activeSubscription = null;
  return endpoint;
}
