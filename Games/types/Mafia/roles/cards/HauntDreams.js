const Card = require("../../Card");
const Action = require("../../Action");
const Random = require("../../../../../lib/Random");
const { PRIORITY_NIGHT_ROLE_BLOCKER } = require("../../const/Priority");

module.exports = class HauntDreams extends Card {
  constructor(role) {
    super(role);

    this.meetings = {
      "Choose Vessel": {
        actionName: "Choose Vessel",
        states: ["Night"],
        flags: ["voting", "mustAct"],
        targets: { include: ["alive", "self"] },
        action: {
          priority: PRIORITY_NIGHT_ROLE_BLOCKER,
          labels: ["absolute"],
          run: function () {
            this.actor.role.loved = true;
            this.actor.role.data.DreamHost = this.target;
            this.actor.passiveEffects.push(
              this.target.giveEffect("Delirious", this.actor, Infinity)
            );
            this.blockWithDelirium(this.target);
            this.game.events.emit("AbilityToggle", this.actor);
          },
        },
        shouldMeet() {
          return !this.loved;
        },
      },
    };

    this.listeners = {
      AbilityToggle: function (player) {
        if (
          this.player.hasAbility(["OnlyWhenAlive"]) &&
          this.player.role.data.DreamHost &&
          this.player.role.data.DreamHost.alive
        ) {
          if (
            this.DreamImmortalEffect == null ||
            !this.player.effects.includes(this.DreamImmortalEffect)
          ) {
            this.DreamImmortalEffect = this.player.giveEffect(
              "Immortal",
              5,
              Infinity
            );
            this.player.passiveEffects.push(this.DreamImmortalEffect);
          }
        } else {
          var index = this.player.passiveEffects.indexOf(
            this.DreamImmortalEffect
          );
          if (index != -1) {
            this.player.passiveEffects.splice(index, 1);
          }
          if (this.DreamImmortalEffect != null) {
            this.DreamImmortalEffect.remove();
            this.DreamImmortalEffect = null;
          }
        }

        if (
          this.player.hasAbility(["OnlyWhenAlive"]) &&
          this.player.role.data.DreamHost &&
          !this.player.role.data.DreamHost.alive
        ) {
          let action = new Action({
            actor: this.player,
            target: this.player,
            game: this.game,
            labels: ["kill", "hidden"],
            power: 5,
            run: function () {
              if (this.dominates()) this.target.kill("basic", this.actor, true);
            },
          });
          this.game.instantAction(action);
        }
      },
    };
  }
};
