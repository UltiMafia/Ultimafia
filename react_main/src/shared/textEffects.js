// Copy of /shared/textEffects.js (the server's copy); the client build only
// sees react_main/src. test/textEffects.test.js checks the two stay in sync.
// Chat text effects ("/wave hello"), unlocked by the "Advanced Text Effects"
// shop item. Shared by the game server (Games/core/Player.js), which strips
// the command and decides who gets an effect, and the client
// (components/TextEffects.jsx), which only draws effects the server attached.

const TEXT_EFFECTS = {
  wave: "Each letter bounces once, in a wave.",
  shake: "The message jitters briefly.",
  glow: "The message pulses with a soft glow once.",
  rainbow: "Colours sweep across the message once.",
  slide: "The message slides in from the side.",
  flash: "The message blinks twice.",
};

const TEXT_EFFECT_NAMES = Object.keys(TEXT_EFFECTS);

const COMMAND_RE = /^\/([a-z]+)(?:\s+([\s\S]*))?$/i;

// Returns null when the content is not a text effect command (so other
// commands such as /role keep working), otherwise { effect, text } where
// text is the message without the command (possibly "").
function parseTextEffect(content) {
  if (typeof content !== "string") return null;
  const match = COMMAND_RE.exec(content);
  if (!match) return null;
  const effect = match[1].toLowerCase();
  if (!TEXT_EFFECTS[effect]) return null;
  return { effect, text: (match[2] || "").trim() };
}

function isTextEffect(effect) {
  return typeof effect === "string" && TEXT_EFFECTS[effect] !== undefined;
}

module.exports = {
  TEXT_EFFECTS,
  TEXT_EFFECT_NAMES,
  parseTextEffect,
  isTextEffect,
};
