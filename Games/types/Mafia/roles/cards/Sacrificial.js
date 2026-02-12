const Card = require("../../Card");
const Action = require("../../Action");
const { PRIORITY_KILL_DEFAULT } = require("../../const/Priority");

module.exports = class Sacrificial extends Card {
  constructor(role) {
    super(role);
    this.passiveActions = [
      {
        ability: ["Modifier", "Kill"],
        state: "Night",
        actor: role.player,
        game: role.player.game,
        priority: PRIORITY_KILL_DEFAULT,
        labels: ["kill", "hidden"],
        role: role,
        run: function () {
            let visits = this.getSecondaryActions(this.actor);
            if (
              visits.length > 0 &&
              this.dominates(this.actor)
            ) {
              this.actor.kill("basic", this.actor);
            }
          },
      },
    ];
/*
    this.listeners = {
      state: function (stateInfo) {
        if (!this.hasAbility(["Kill", "Modifier"])) {
          return;
        }

        if (!stateInfo.name.match(/Night/)) {
          return;
        }

        var action = new Action({
          actor: this.player,
          game: this.player.game,
          priority: PRIORITY_KILL_DEFAULT,
          labels: ["kill", "hidden"],
          run: function () {
            if (
              this.hasVisits(this.actor) === true &&
              this.dominates(this.actor)
            ) {
              this.actor.kill("basic", this.actor);
            }
          },
        });

        this.game.queueAction(action);
      },
    };
    */
  }
};
