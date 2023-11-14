const Item = require("../Item");

module.exports = class Armor extends Item {
  constructor(options) {
    super("Armor");

    this.uses = 1;
    // if armour starts out cursed, the setter will handle the logic of making it cursed
    this.cursedUses = 0;
    this.optionCursed = options?.cursed;
    //this.cultUses = 1
    //this.optionCult = options?.cult

    this.listeners = {
      immune: function (action, player) {
        let killer = this.getVisitors(this.target, "kill");

        if (player == this.holder && action.hasLabel("kill")) {
          if (this.holder.tempImmunity["kill"]) return;

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

          if (this.uses <= 0) {
            this.removeEffectsIfNeeded();
            /*if (this.cultUses <= 0) {
              this.killer.giveEffect("Insanity", this.holder);
            }*/
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
        //item.cultUses += this.cultUses;
        item.applyEffectsIfNeeded();
        return;
      }
    }

    super.hold(player);
    this.cursed = this.optionCursed;
    //this.cult = this.optionCult;
  }
};
