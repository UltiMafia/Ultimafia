const Card = require("../../Card");
const Action = require("../../Action");
const Random = require("../../../../../lib/Random");
const { PRIORITY_BLOCK_EARLY } = require("../../const/Priority");

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
          priority: PRIORITY_BLOCK_EARLY - 1,
          labels: ["absolute"],
          role: this.role,
          run: function () {
            this.role.loved = true;
            this.role.data.DreamHost = this.target;
            this.role.passiveEffects.push(
              this.role.giveEffect(
                this.target,
                "Delirious",
                this.actor,
                Infinity,
                null,
                this.role
              )
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

    this.passiveActions = [
      {
        ability: ["Effect"],
        actor: role.player,
        state: "Night",
        game: role.game,
        role: role,
        priority: PRIORITY_BLOCK_EARLY - 1,
        labels: ["block", "delirium"],
        run: function () {
            if (
              this.role.data.DreamHost &&
              this.role.data.DreamHost.effects.filter(
                (e) => e.name == "Delirious" && e.source == this.role
              ).length <= 0
            ) {
              if (this.dominates(this.role.data.DreamHost)) {
                let effect = this.role.giveEffect(
                  this.role.data.DreamHost,
                  "Delirious",
                  this.actor,
                  Infinity,
                  null,
                  this.role
                );
                this.blockWithDelirium(this.role.data.DreamHost, true);
              }
            }
          },
      },
    ];



    this.listeners = {
      AbilityToggle: function (player) {
        if (
          this.hasAbility(["OnlyWhenAlive"]) &&
          this.data.DreamHost &&
          this.data.DreamHost.alive
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
            this.passiveEffects.push(this.DreamImmortalEffect);
          }
        } else {
          var index = this.passiveEffects.indexOf(this.DreamImmortalEffect);
          if (index != -1) {
            this.passiveEffects.splice(index, 1);
          }
          if (this.DreamImmortalEffect != null) {
            this.DreamImmortalEffect.remove();
            this.DreamImmortalEffect = null;
          }
        }

        if (
          this.hasAbility(["OnlyWhenAlive"]) &&
          this.data.DreamHost &&
          !this.data.DreamHost.alive
        ) {
          let action = new Action({
            actor: this.player,
            target: this.player,
            game: this.game,
            role: this,
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
