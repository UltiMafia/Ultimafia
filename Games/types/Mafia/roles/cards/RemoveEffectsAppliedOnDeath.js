const Card = require("../../Card");
const Random = require("../../../../../lib/Random");

module.exports = class RemoveEffectsAppliedOnDeath extends Card {
  constructor(role) {
    super(role);

    this.listeners = {
      AbilityToggle: function (player) {
        if (player != this.player) {
          return;
        }
        if (this.hasAbility(["Effect"])) {
          return;
        } else {
          for (let player of this.game.players) {
            for (let effect of player.effects) {
              if (effect.source && effect.source == this) {
                effect.remove();
              }
            }
          }
        }
      },
      RoleBeingRemoved: function (role, player, isExtraRole) {
        if (role == this) {
          for (let player of this.game.players) {
            for (let effect of player.effects) {
              if (effect.source && effect.source == this) {
                effect.remove();
              }
            }
          }
        }
      },
    };
  }
};
