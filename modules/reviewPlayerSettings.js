// The review client builds its player map from each user's settings, the same
// fields an in-game player payload carries (Games/core/Player.getPlayerInfo).
// Review data used to replace settings with only textColor/nameColor, so name
// fonts, animated name colors, gradients and custom emotes never rendered in a
// review. Keep exactly the fields the client reads and nothing else. The
// in-game square avatar is gated on the avatar-shape shop item when the setting
// is written (routes/user.js), and the review client forces "circle" for
// anonymous games, so the stored setting is safe to pass through here.
const REVIEW_SETTINGS_FIELDS = [
  "textColor",
  "nameColor",
  "nameFont",
  "animatedNameColor",
  "nameGradientColorA",
  "nameGradientColorB",
  "nameGradientColorC",
  "gameAvatarShape",
  "customEmotes",
  "customStickers",
];

function reviewPlayerSettings(settings) {
  const source = settings || {};
  const out = {};

  for (const field of REVIEW_SETTINGS_FIELDS) {
    if (source[field] !== undefined) out[field] = source[field];
  }

  return out;
}

module.exports = { reviewPlayerSettings, REVIEW_SETTINGS_FIELDS };
