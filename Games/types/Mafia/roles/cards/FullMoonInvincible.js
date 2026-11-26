const Card = require("../../Card");

// Card listeners are bound to the Role, so these take the role explicitly
// instead of being called as methods on the card.
function applyFullMoonInvincibility(role) {
  if (role.fullMoonApplying) return;

  if (
    role.fullMoonEffect != null &&
    role.player.effects.includes(role.fullMoonEffect)
  ) {
    return;
  }

  // giveEffect emits AbilityToggle, which can land back here before the
  // effect reference has been stored.
  role.fullMoonApplying = true;
  try {
    role.fullMoonEffect = role.player.giveEffect("Immortal", 5, Infinity);
    role.passiveEffects.push(role.fullMoonEffect);
  } finally {
    role.fullMoonApplying = false;
  }
}

function removeFullMoonInvincibility(role) {
  if (role.fullMoonEffect == null) return;

  var index = role.passiveEffects.indexOf(role.fullMoonEffect);
  if (index != -1) {
    role.passiveEffects.splice(index, 1);
  }

  role.fullMoonEffect.remove();
  role.fullMoonEffect = null;
}

module.exports = class FullMoonInvincible extends Card {
  constructor(role) {
    super(role);

    this.listeners = {
      stateEvents: function (stateEvents) {
        if (stateEvents["Full Moon"] == true) {
          if (!this.hasAbility(["OnlyWhenAlive"])) {
            return;
          }
          this.player.queueAlert(":invincible: You are invincible tonight.");
          // CauseFullMoons sets stateEvents["Full Moon"] on the state event,
          // which runs before stateEvents. AbilityToggle does not fire on its
          // own, so apply the effect here as well or the first full-moon kill
          // resolves against no immunity.
          applyFullMoonInvincibility(this);
          return;
        }

        removeFullMoonInvincibility(this);
      },
      AbilityToggle: function (player) {
        if (player != this.player) {
          return;
        }

        if (
          this.hasAbility(["OnlyWhenAlive"]) &&
          (this.game.getStateName() == "Night" ||
            this.game.getStateName() == "Dawn") &&
          this.game.stateEvents["Full Moon"] == true
        ) {
          applyFullMoonInvincibility(this);
        } else {
          removeFullMoonInvincibility(this);
        }
      },
    };
  }
};
