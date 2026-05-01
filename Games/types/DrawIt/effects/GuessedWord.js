const Effect = require("../../../core/Effect");

// Marker effect applied to a player when they correctly guess the word during
// a Draw round. Drives speech routing in DrawItGame.preprocessMessage:
// players holding this effect (plus the drawer) form a private speech circle
// — non-guessers cannot see what they say. The effect is cleared at the
// start of each new Pick state.
module.exports = class GuessedWord extends Effect {
  constructor() {
    super("GuessedWord");
  }
};
