const Item = require("../Item");
const Action = require("../Action");
const roles = require("../../../../data/roles");
const Random = require("../../../../lib/Random");

module.exports = class Tract extends Item {
  constructor(options) {
    super("Tract");

    this.uses = 1;
    // if tract starts out broken, the setter will handle the logic of making it broken
    this.brokenUses = 0;
    this.optionBroken = options?.broken;
    this.optionMagicCult = options?.magicCult;

    this.listeners = {
      immune: function (action, player) {
        //let converter = this.getVisitors(this.target, "convert");

        if (this.magicCult) {
          return;
        }

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
          if (this.magicCult) {
            this.holder.queueAlert(
              ":bible: Forces have tried to corrupt your heart, and your faith empowered them."
            );
          }
          this.holder.queueAlert(
            ":bible: Forces have tried to corrupt your heart, but your faith protected you."
          );

          if (this.uses <= 0) {
            this.removeEffectsIfNeeded();
            if (this.brokenUses <= 0) {
              this.drop();
            }
          }
        }
      },
      roleAssigned: function (player) {
        if (player !== this.holder) {
          return;
        }

        if (this.magicConvert) {
          this.drop();
          const randomCultRole = Random.randArrayVal(
            Object.entries(roles.Mafia)
              .filter((roleData) => roleData[1].alignment === "Cult")
              .map((roleData) => roleData[0])
          );
          this.holder.setRole(randomCultRole);
          this.magicConvert = false;
        }
        /*
        if (player.role.name == "Cultist" && player == this.holder && this.magicCult) {
          let action = new Action({
            actor: this.holder,
            target: this.holder,
            game: this.game,
            labels: ["convert", "curse", "hidden","instant"],
            item: this,
            run: function () {
              if (this.dominates()) {
                const randomCultRole = Random.randArrayVal(Object.entries(roles.Mafia).filter((roleData) => roleData[1].alignment === "Cult").map((roleData) => roleData[0]));
                this.target.setRole(randomCultRole);
              }
              this.item.drop();
            },
          });

          this.game.instantAction(action);
        }
        */
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

  set magicCult(magicCult) {
    if (magicCult) {
      this.magicConvert = true;
      this.removeEffectsIfNeeded();
      this.effects = [];
      //this.applyEffects();
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
      if (this.magicCult) {
        this.effects = ["EmpoweredConversion"];
      } else {
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
    //this.magicCult = this.optionMagicCult;
  }
};
