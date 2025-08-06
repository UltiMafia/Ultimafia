const Card = require("../../Card");
const Action = require("../../Action");
const Random = require("../../../../../lib/Random");
const {
  PRIORITY_NIGHT_SAVER,
  PRIORITY_KILL_DEFAULT,
} = require("../../const/Priority");

module.exports = class NightBodyguard extends Card {
  constructor(role) {
    super(role);

    this.meetings = {
      "Night Bodyguard": {
        actionName: "Save",
        states: ["Night"],
        flags: ["voting"],
        action: {
          labels: ["save"],
          priority: PRIORITY_NIGHT_SAVER,
          role: this.role,
          run: function () {
            this.heal(1);

            let killers = this.getVisitors(this.target, "kill");
            if (killers.length == 0) {
              return;
            }

            this.role.killers = killers;
            this.role.savedRole = this.target.role.name;
          },
        },
      },
    };
    /*
    this.actions = [
      {
        priority: PRIORITY_KILL_DEFAULT,
        labels: ["kill", "hidden", "absolute"],
        run: function () {
          if (this.game.getStateName() != "Night") return;

          // target was not attacked
          let killers = this.actor.role.killers;
          if (!killers) {
            return;
          }

          // checks how many to kill
          let killsAllAttackers = false;
          if (this.actor.role.savedRole === "Celebrity") {
            killsAllAttackers = true;
          }

          // kill attackers first
          if (!killsAllAttackers) {
            killers = [Random.randArrayVal(killers)];
          }
          for (let k of killers) {
            if (this.dominates(k)) {
              k.kill("basic", this.actor);
            }
          }

          // bodyguard did not survive the fight
          if (this.dominates(this.actor)) {
            this.actor.kill("basic", killers[0]);
          }
        },
      },
    ];
*/

    this.listeners = {
      state: function (stateInfo) {
        if (!this.hasAbility(["Kill"])) {
          return;
        }

        if (!stateInfo.name.match(/Night/)) {
          return;
        }

        var action = new Action({
          actor: this.player,
          game: this.player.game,
          priority: PRIORITY_KILL_DEFAULT,
          role: this.role,
          labels: ["kill", "hidden", "absolute"],
          run: function () {
            // target was not attacked
            let killers = this.role.killers;
            if (!killers) {
              return;
            }

            // checks how many to kill
            let killsAllAttackers = false;
            if (this.role.savedRole === "Celebrity") {
              killsAllAttackers = true;
            }

            // kill attackers first
            if (!killsAllAttackers) {
              killers = [Random.randArrayVal(killers)];
            }
            for (let k of killers) {
              if (this.dominates(k)) {
                k.kill("basic", this.actor);
              }
            }

            // bodyguard did not survive the fight
            if (this.dominates(this.actor)) {
              this.actor.kill("basic", killers[0]);
            }
          },
        });

        this.game.queueAction(action);
      },
    };
  }
};
