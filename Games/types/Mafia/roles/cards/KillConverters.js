const Card = require("../../Card");
const Action = require("../../Action");
const { PRIORITY_KILL_DEFAULT } = require("../../const/Priority");

module.exports = class KillConverters extends Card {
  constructor(role) {
    super(role);

    this.role.killLimit = 2;

    this.passiveActions = [
      {
        ability: ["Kill", "Modifier"],
        actor: role.player,
        state: "Night",
        game: role.game,
        role: role,
        priority: PRIORITY_KILL_DEFAULT,
        labels: ["kill", "hidden"],
        run: function () {
          if (this.role.killLimit <= 0) {
            return;
          }

          var convertingVisitors = this.getVisitors(this.actor, "convert");

          for (let visitor of convertingVisitors) {
            if (this.role.killLimit > 0 && this.dominates(visitor)) {
              visitor.kill("basic", this.actor);
              this.role.killLimit--;
            }
          }
        },
      },
    ];

    this.listeners = {
      AbilityToggle: function (player) {
        if (player != this.player) {
          return;
        }
        if (this.hasAbility(["Modifier"]) && this.role.killLimit > 0) {
          if (
            this.ConvertImmuneKillEffect == null ||
            !this.player.effects.includes(this.ConvertImmuneKillEffect)
          ) {
            this.ConvertImmuneKillEffect = this.player.giveEffect(
              "ConvertImmune",
              1,
              Infinity
            );
            this.passiveEffects.push(this.ConvertImmuneKillEffect);
          }
        } else {
          var index = this.passiveEffects.indexOf(this.ConvertImmuneKillEffect);
          if (index != -1) {
            this.passiveEffects.splice(index, 1);
          }
          if (this.ConvertImmuneKillEffect != null) {
            this.ConvertImmuneKillEffect.remove();
            this.ConvertImmuneKillEffect = null;
          }
        }
      },
    };
  }
};
