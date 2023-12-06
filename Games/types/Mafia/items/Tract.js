const Item = require("../Item");

module.exports = class Tract extends Item {
  constructor(options) {
    super("Tract");

    this.uses = 1;

    this.listeners = {
      immune: function (action, player) {
        if (player == this.holder && action.hasLabel("convert")) {
          if (this.holder.tempImmunity["convert"]) return;

          this.uses--;
          this.holder.queueAlert(
            ":bible: Your faith protected you."
          );

          if (this.uses <= 0) {
            this.removeEffectsIfNeeded();
          }
        }
      },
    };
  }

  removeEffectsIfNeeded() {
    if (this.effects.length > 0) {
      this.removeEffects();
      this.effects = [];
    }
  }

  applyEffectsIfNeeded() {
    if (this.uses > 0 && this.effects.length == 0) {
      this.effects = ["Kill Immune"];
      this.applyEffects();
    }
  }

  hold(player) {
    for (let item of player.items) {
      if (item.name == "Tract") {
        item.uses += this.uses;
        item.applyEffectsIfNeeded();
        return;
      }
    }

    super.hold(player);
  }
};
