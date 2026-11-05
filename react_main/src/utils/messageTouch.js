import { isReplyClick } from "./messageReply.js";

const REPLY_DISTANCE = 64;
const MOVE_TOLERANCE = 8;

// Native, non-passive touchmove is deliberate: React 17 delegates passive
// touch listeners, which cannot prevent a claimed horizontal swipe. Only the
// active row is updated; moving a finger never re-renders the transcript.
export function bindMessageTouch(row, {
  canReply,
  onReply,
  onPin,
  getSelection = () => window.getSelection(),
  getStyle = (el) => window.getComputedStyle(el),
  setTimer = setTimeout,
  clearTimer = clearTimeout,
  vibrate = (duration) => typeof navigator !== "undefined" && navigator.vibrate?.(duration),
}) {
  let gesture = null;
  let pinTimer;
  function stopPin() {
    clearTimer(pinTimer);
    pinTimer = undefined;
  }
  function reset() {
    stopPin();
    gesture = null;
    row.classList.remove("reply-swiping", "reply-swipe-ready");
    row.style.removeProperty("--reply-swipe-offset");
  }
  function point(touches) {
    return Array.from(touches || []).find((t) => t.identifier === gesture?.id);
  }
  function start(e) {
    reset();
    if (e.touches.length !== 1 || !isReplyClick(e, row, {
      selection: getSelection(), getComputedStyle: getStyle,
    })) return;
    const t = e.touches[0];
    gesture = { id: t.identifier, x: t.clientX, y: t.clientY, swiping: false, didHaptic: false };
    pinTimer = setTimer(() => {
      // A held line pins, never also replies if the finger subsequently moves.
      gesture = null;
      pinTimer = undefined;
      onPin();
    }, 600);
  }
  function move(e) {
    if (!gesture) return;
    const t = point(e.touches);
    if (e.touches.length !== 1 || !t || getSelection()?.toString().trim()) {
      reset();
      return;
    }
    const dx = t.clientX - gesture.x;
    const dy = t.clientY - gesture.y;
    if (Math.hypot(dx, dy) <= MOVE_TOLERANCE) return;
    stopPin();
    // Lock out vertical/right intent for the rest of this gesture. Leave
    // vertical scrolling and pinch zoom entirely to the browser.
    if (!canReply || dx >= 0 || Math.abs(dy) >= -dx / 1.5) {
      reset();
      return;
    }
    gesture.swiping = true;
    if (e.cancelable) e.preventDefault();
    row.classList.add("reply-swiping");
    if (-dx >= REPLY_DISTANCE) {
      row.classList.add("reply-swipe-ready");
      if (!gesture.didHaptic) {
        gesture.didHaptic = true;
        // Optional browser feedback, not a requirement for replying. Safari
        // has no Vibration API; devices/policies may also refuse the request.
        try { vibrate(10); } catch { /* Keep the gesture working without haptics. */ }
      }
    } else row.classList.remove("reply-swipe-ready");
    // Follow directly up to the reply threshold, then smoothly approach a
    // further 48px of travel. The slope is continuous at the threshold and
    // keeps decreasing instead of running into a hard clamp.
    const distance = -dx;
    const offset = distance <= REPLY_DISTANCE ? distance :
      REPLY_DISTANCE + 48 * (1 - Math.exp(-(distance - REPLY_DISTANCE) / 48));
    row.style.setProperty("--reply-swipe-offset", `${-offset}px`);
  }
  function end(e) {
    const t = point(e.changedTouches);
    const reply = gesture && gesture.swiping && t && !e.touches.length &&
      gesture.x - t.clientX >= REPLY_DISTANCE &&
      Math.abs(t.clientY - gesture.y) < (gesture.x - t.clientX) / 1.5 &&
      !getSelection()?.toString().trim();
    reset();
    // Keep this synchronous in the release event so iOS can open its keyboard.
    if (reply) onReply();
  }
  row.addEventListener("touchstart", start, { passive: true });
  row.addEventListener("touchmove", move, { passive: false });
  row.addEventListener("touchend", end);
  row.addEventListener("touchcancel", reset);
  return () => {
    reset();
    row.removeEventListener("touchstart", start);
    row.removeEventListener("touchmove", move);
    row.removeEventListener("touchend", end);
    row.removeEventListener("touchcancel", reset);
  };
}
