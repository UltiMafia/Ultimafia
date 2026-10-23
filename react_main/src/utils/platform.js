/**
 * Platform facts that change how the app has to lay itself out.
 */

export function isIos() {
  if (typeof navigator === "undefined") return false;

  return (
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    // iPadOS 13+ reports as a Mac; the touch point check separates it out.
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
  );
}

/**
 * Whether the browser already keeps the layout viewport clear of the bottom safe
 * area, in which case adding the inset again leaves a strip of empty bar above
 * the browser's own reserved space.
 *
 * There is no feature test for this -- both kinds report a non-zero
 * `env(safe-area-inset-bottom)`. Observed behaviour: Firefox on Android
 * (Gecko) reserves the strip itself; Chrome on Android (Blink) and every iOS
 * browser (WebKit) hand it to the page once `viewport-fit=cover` is set.
 *
 * Only `Firefox/` is matched: Firefox on iOS reports `FxiOS/...` and runs
 * WebKit, so it belongs with the browsers that hand the strip over.
 */
export function browserReservesBottomSafeArea() {
  if (typeof navigator === "undefined") return false;

  return /Firefox\//.test(navigator.userAgent);
}
