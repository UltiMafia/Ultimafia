const Item = require("../Item");
const Action = require("../Action");

module.exports = class HauntedMask extends Item {
  constructor(options) {
    super("Haunted Mask");

    this.uses = 1;
    // if armour starts out broken, the setter will handle the logic of making it broken
    this.brokenUses = 0;
    this.optionBroken = options?.broken;
    this.magicCult = options?.magicCult;
    this.hasBeenUsed = false;
    this.data = {};

    this.listeners = {
      immune: function (action, player) {
        //let killer = this.getVisitors(this.target, "kill");

        if (
          player == this.holder &&
          action.hasLabel("kill") &&
          !action.hasLabel("Haunted Mask") &&
          this.hasBeenUsed == false
        ) {
          if (this.holder.tempImmunity["kill"]) return;

          // check for effect immunity
          for (let effect of this.holder.effects)
            if (
              effect.immunity["kill"] &&
              effect.name != "HauntedMaskProtection"
            )
              return;

          // check for saves
          for (let action2 of this.game.actions[0]) {
            if (action2.target === this.holder && action2.hasLabel("save")) {
              return;
            }
          }
          this.hasBeenUsed = true;
          this.cannotBeStolen = true;
          this.removeEffectsIfNeeded();
          if (action.actor && this.holder && action.actor != this.holder) {
            let action4 = new Action({
              actor: this.holder,
              target: action.actor,
              game: this.game,
              labels: ["kill", "Haunted Mask"],
              item: this,
              run: function () {
                if (this.dominates(this.target)) {
                  this.target.kill("basic", this.actor, true);
                }
              },
            });

            if (action4.dominates(action4.target, false)) {
              let action3 = new Action({
                actor: this.holder,
                target: action.actor,
                game: this.game,
                labels: ["hidden", "Haunted Mask"],
                item: this,
                run: function () {
                  var originalActor = this.actor;
                  this.item.drop();
                  this.item.hold(this.target);
                  this.actor.queueAlert(
                    ":armor: The Haunted Mask protects you but at a Cost!"
                  );
                  stealIdentity.bind(originalActor.role)(this.target);
                  if (
                    this.game.getStateName() == "Night" ||
                    this.game.getStateName() == "Dawn" ||
                    this.game.getStateName() == "Dusk"
                  ) {
                    this.actor.kill("basic", this.actor, false);
                  } else {
                    this.actor.kill("basic", this.actor, true);
                  }
                },
              });
              action3.do();
            } else {
              action4.do();
              this.holder.queueAlert(":armor: The Haunted Mask protects you!");
            }
          } else {
            this.holder.queueAlert(":armor: The Haunted Mask protects you!");
          }
        }
      },
      /*
      death: function (player, killer, deathType) {
        let swappedPlayers = this.game
          .alivePlayers()
          .filter((p) => p.user.swapped);
        if (swappedPlayers.length <= 0) {
          this.game.resetIdentities();
        }
      },
      */
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
      this.effects = ["HauntedMaskProtection"];
      this.applyEffects();
    }
  }

  hold(player) {
    for (let item of player.items) {
      if (item.name == "Haunted Mask" && item != this) {
        return;
      }
    }
    super.hold(player);
    if (this.hasBeenUsed != true) {
      this.applyEffectsIfNeeded();
    }
  }
};

function stealIdentity(target) {
  if (!this.game.swaps) this.game.swaps = [];

  if (!this.data.originalUser) this.data.originalUser = this.player.user;
  if (!this.data.originalPlayer) this.data.originalPlayer = this.player;

  target.queueAlert(":anon: Someone has stolen your identity!");
  this.game.swaps.unshift([this.player, target]);
  this.player.swapIdentity(target);
  this.data.originalUser.swapped = target.user;
}
