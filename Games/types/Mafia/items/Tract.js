const Item = require("../Item");

module.exports = class Tract extends Item {
  constructor(options) {
    super("Tract");

    this.uses = 1;
    // if tract starts out broken, the setter will handle the logic of making it broken
    this.brokenUses = 0;
    this.optionBroken = options?.broken;
    this.magicCult = options?.magicCult;
    

    this.listeners = {
      immune: function (action, player) {
        //let converter = this.getVisitors(this.target, "convert");

        if (player == this.holder && action.hasLabel("convert")) {
          if (this.holder.tempImmunity[("convert", 1)]) return;

          // check for effect immunity
          for (let effect of this.holder.effects)
            if (effect.immunity["convert"] && effect.name != "Convert Immune")
              return;

          // check for saves
          for (let action of this.game.actions[0]) {
            if (action.target === this.holder && action.hasLabel("reinforce")) {
              return;
            }
          }

          this.uses--;
          if(this.magicCult){
            this.holder.queueAlert(
            ":bible: Forces have tried to corrupt your heart, and your faith empowered them."
          );
          }
          else{
          this.holder.queueAlert(
            ":bible: Forces have tried to corrupt your heart, but your faith protected you."
          );
          }
          if (this.uses <= 0) {
            this.removeEffectsIfNeeded();
            if (this.brokenUses <= 0) {
              this.drop();
            }
          }
        }
      },
    };
  }

  set broken(broken) {
    if (broken) {
      this.brokenUses += this.uses;
      this.uses = 0;
      this.removeEffectsIfNeeded();
    } else {
      this.uses += this.brokenUses;
      this.brokenUses = 0;
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
      if(this.magicCult){
        this.effects = ["EmpoweredConversion"];
      }
      else{
      this.effects = ["Convert Immune"];
      }
      this.applyEffects();
    }
  }

  hold(player) {
    for (let item of player.items) {
      if (item.name == "Tract") {
        item.uses += this.uses;
        item.brokenUses += this.brokenUses;
        item.applyEffectsIfNeeded();
        return;
      }
    }

    super.hold(player);
    this.broken = this.optionBroken;
  }
};
