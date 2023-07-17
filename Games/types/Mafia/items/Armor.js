const Item = require("../Item");

module.exports = class Armor extends Item {
  constructor(options) {
    super("Armor");

    this.uses = 1;
    // if armour starts out cursed, the setter will handle the logic of making it cursed
    this.cursedUses = 0;
    this.optionCursed = options?.cursed;

    this.listeners = {
      immune: function (action) {
        if (
          action.target == this.holder &&
          action.hasLabel("kill") &&
          !this.holder.tempImmunity["kill"]
        ) {
          // check for effect immunity
          for (let effect of this.holder.effects)
            if (effect.immunity["kill"] && effect.name != "Kill Immune") return;

          // check for saves
          for (let action of this.game.actions[0]) {
            if (action.target === this.holder && action.hasLabel("save")) {
              return;
            }
          }

          this.uses--;
          this.holder.queueAlert(
            ":armor: Shattering to pieces, your armor saves your life!"
          );

          if (this.uses <= 0 && this.cursedUses <= 0) this.drop();
        }
      },
    };
  }

  set cursed(cursed) {
    if (cursed) {
      this.cursedUses += this.uses;
      this.uses = 0;
    } else {
      this.uses += this.cursedUses;
      this.cursedUses = 0;
    }

    if (cursed) {
      this.removeEffects();
      this.effects = [];
    } else {
      this.effects = ["Kill Immune"];
      this.applyEffects();
    }
  }

  hold(player) {
    for (let item of player.items) {
      if (item.name == "Armor") {
        if (this.cursed) {
          item.cursedUses++;
        } else {
          item.uses++;
        }
        return;
      }
    }

    super.hold(player);
    this.cursed = this.optionCursed;
  }
};
