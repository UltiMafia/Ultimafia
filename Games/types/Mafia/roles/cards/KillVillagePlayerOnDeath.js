const Card = require("../../Card");
const Action = require("../../Action");
const { PRIORITY_DAY_DEFAULT } = require("../../const/Priority");
const { PRIORITY_KILL_DEFAULT } = require("../../const/Priority");
const {
  PRIORITY_INVESTIGATIVE_AFTER_RESOLVE_DEFAULT,
} = require("../../const/Priority");

module.exports = class KillVillagePlayerOnDeath extends Card {
  constructor(role) {
    super(role);

    this.meetings = {
      "Choose Player": {
        actionName: "Choose player to kill if Village Aligned",
        states: ["Day"],
        flags: ["voting", "mustAct", "instant"],
        shouldMeet: function () {
          return !this.revived;
        },
        action: {
          priority: PRIORITY_DAY_DEFAULT - 1,
          run: function () {
            this.actor.role.revived = true;

            this.game.queueAlert(
              `${this.actor.name} the ${this.actor.role.name} has selected ${this.target.name}. If ${this.target.name} is Village Aligned they will die tonight.`
            );

            if (!this.actor.hasAbility(["Kill", "WhenDead"])) {
              return;
            }
            //this.hasChoosen = true;
            this.actor.role.SelectedPlayer = this.target;
          },
        },
      },
    };
    /*
    this.actions = [
      {
        priority: PRIORITY_KILL_DEFAULT,
        labels: ["hidden", "kill"],
        run: function () {
          if (this.game.getStateName() != "Night") return;

          if (!this.actor.role.SelectedPlayer) return;
          if (this.actor.role.SelectedPlayer.role.alignment != "Village")
            return;
          this.dominates(this.target){
          this.actor.role.SelectedPlayer.kill("basic", this.actor);
          }
        },
      },
    ];
*/
    this.listeners = {
      state: function (stateInfo) {
        if (!this.player.alive) {
          return;
        }

        if (!stateInfo.name.match(/Night/)) {
          return;
        }

        var action = new Action({
          actor: this.player,
          game: this.player.game,
          priority: PRIORITY_KILL_DEFAULT,
          labels: ["hidden", "kill"],
          run: function () {
            if (!this.actor.role.SelectedPlayer) return;
            if (this.actor.role.SelectedPlayer.role.alignment != "Village")
              return;
            if (this.dominates(this.target)) {
              this.actor.role.SelectedPlayer.kill("basic", this.actor);
            }
          },
        });

        this.game.queueAction(action);
      },
    };
  }
};
