const Item = require("../Item");

module.exports = class Tract extends Item {
  constructor(options) {
    super("Tract");

    this.uses = 1;
    // if armour starts out cursed, the setter will handle the logic of making it cursed
    this.cursedUses = 0;
    this.optionCursed = options?.cursed;

    this.listeners = {
      immune: function (action, player) {
        if (player == this.holder && action.hasLabel("convert")) {
          if (this.holder.tempImmunity["convert"]) return;

          this.uses--;
          this.holder.queueAlert(
            ":bible: Strangers came to your door last night to preach, but your faith protected you."
          );

          if (this.uses <= 0) {
            this.removeEffectsIfNeeded();
            if (this.cursedUses <= 0) {
              this.drop();
            }
          }
        }
      },
    };
  }

  set cursed(cursed) {
    if (cursed) {
      this.cursedUses += this.uses;
      this.uses = 0;
      this.removeEffectsIfNeeded();
    } else {
      this.uses += this.cursedUses;
      this.cursedUses = 0;
      this.applyEffectsIfNeeded();
    }
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
      if (item.name == "Armor") {
        item.uses += this.uses;
        item.cursedUses += this.cursedUses;
        item.applyEffectsIfNeeded();
        return;
      }
    }

    super.hold(player);
    this.cursed = this.optionCursed;
  }
};
