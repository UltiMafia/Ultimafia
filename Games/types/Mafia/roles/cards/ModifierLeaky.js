const Card = require("../../Card");
const Random = require("../../../../../lib/Random");

module.exports = class ModifierLeaky extends Card {
  constructor(role) {
    super(role);

    this.listeners = {
      AbilityToggle: function (player) {
        if (player != this.player) {
          return;
        }
        if (this.hasLeakyEffect) {
          return;
        }
        if (this.hasAbility(["Modifier", "Speaking", "Whispers"])) {
          this.hasLeakyEffect = true;
          this.giveEffect(this.player, "Leak Whispers", Infinity);
        }
      },
    };
  }
};
