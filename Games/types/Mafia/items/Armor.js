const Item = require("../Item");

module.exports = class Armor extends Item {
  constructor(options) {
    super("Armor");

    this.cursed = options?.cursed;
    if (this.cursed) {
      this.lifespan = 1;
      return;
    }

    this.uses = 1;
    this.effects = ["Kill Immune"];
    this.listeners = {
      immune(action) {
        if (
          action.target == this.holder &&
          action.hasLabel("kill") &&
          !this.holder.role.immunity.kill &&
          !this.holder.tempImmunity.kill
        ) {
          // check for effect immunity
          for (const effect of this.holder.effects)
            if (effect.immunity.kill && effect.name != "Kill Immune") return;

          // check for saves
          for (const action of this.game.actions[0]) {
            if (action.target === this.holder && action.hasLabel("save")) {
              return;
            }
          }

          this.uses--;
          this.holder.queueAlert(
            ":sy1a: Shattering to pieces, your armor saves your life!"
          );

          if (this.uses <= 0) this.drop();
        }
      },
    };
  }

  hold(player) {
    for (const item of player.items) {
      if (item.name == "Armor") {
        if (this.cursed) {
          item.drop();
        } else {
          item.uses++;
        }
        return;
      }
    }

    super.hold(player);
  }
};
