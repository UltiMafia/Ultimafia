const Item = require("../Item");
const Action = require("../Action");

module.exports = class HauntedMask extends Item {
  constructor(options) {
    super("HauntedMask");

    this.uses = 1;
    // if armour starts out broken, the setter will handle the logic of making it broken
    this.brokenUses = 0;
    this.optionBroken = options?.broken;
    this.magicCult = options?.magicCult;

    this.listeners = {
      immune: function (action, player) {
        //let killer = this.getVisitors(this.target, "kill");

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

          let action = new Action({
            actor: this.holder,
            target: action.actor,
            game: this.game,
            labels: ["kill", "hidden"],
            item: this,
            run: function () {
              var originalActor = this.actor;
              if (this.dominates()) {
                stealIdentity.bind(originalActor.role)(action.target);
                this.target = originalActor;
                this.target.kill("basic", this.actor, true);
              }
              this.item.hasBeenUsed = true;
              this.item.cannotBeStolen = true;
              this.item.removeEffectsIfNeeded();
            },
          });
          action.do();

          this.uses--;
          this.holder.queueAlert(
            ":armor: The Haunted Mask protects but at a Cost!"
          );
        }
      },
      death: function (player, killer, deathType) {
        if (player == this.holder) resetIdentities.bind(this)();
      },
      aboutToFinish: function () {
        resetIdentities.bind(this)();
      },
      disguiser: function () {
        resetIdentities.bind(this)();
      },
      state: function (stateInfo) {
        if (!this.holder.alive) {
          return;
        }

        if (!stateInfo.name.match(/Night/)) {
          return;
        }
        /*
        var action = new Action({
          actor: this.holder,
          game: this.holder.game,
          priority: PRIORITY_IDENTITY_STEALER_BLOCK,
          run: function () {
            if (this.game.getStateName() != "Night") return;

            var stealing = false;
            var killing = false;

            for (let action of this.game.actions[0]) {
              if (action.hasLabel("stealIdentity") && action.target == "Yes")
                stealing = true;
              else if (action.hasLabels(["kill", "mafia"])) killing = true;
            }

            if (stealing && killing)
              for (let action of this.game.actions[0])
                if (action.target == this.actor) action.cancel(true);
          },
        });

        this.game.queueAction(action);
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
        item.brokenUses += this.brokenUses;
        item.applyEffectsIfNeeded();
        return;
      }
    }

    super.hold(player);
    this.broken = this.optionBroken;
  }
};

function stealIdentity(target) {
  if (!this.data.swaps) this.data.swaps = [];

  if (!this.data.originalUser) this.data.originalUser = this.holder.user;
  if (!this.data.originalPlayer) this.data.originalPlayer = this.holder;
  let temp = this.holder.faction;
  target.queueAlert(":anon: Someone has stolen your identity!");
  this.player.faction = target.faction;
  target.faction = temp;
  this.data.swaps.unshift([this.holder, target]);
  this.player.swapIdentity(target);
  this.data.originalUser.swapped = target.user;
}

function resetIdentities() {
  if (!this.data.swaps) return;

  for (let swap of this.data.swaps) {
    swap[0].swapIdentity(swap[1]);
    delete swap[1].swapped;
  }

  delete this.data.swaps;
  delete this.data.originalUser.swapped;
}
