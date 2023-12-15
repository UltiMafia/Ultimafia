const Card = require("../../Card");
const Random = require("../../../../../lib/Random");
const { PRIORITY_INVESTIGATIVE_DEFAULT } = require("../../const/Priority");
const { PRIORITY_DAY_DEFAULT } = require("../../const/Priority");

module.exports = class BegumsSenses extends Card {
  constructor(role) {
    super(role);

    this.meetings = {
      "Discover Target's Identity": {
        states: ["Day"],
        flags: ["voting"],
        inputType: "boolean",
        action: {
          priority: PRIORITY_DAY_DEFAULT,
          run: function () {
            if (this.target == "No") return;
            this.actor.queueAlert(
              `You learn that your target was ${this.actor.role.begumTarget.name}!`
            );
            delete this.actor.role.begumTarget;
          },
        },
        shouldMeet() {
          return this.begumTarget;
        },
      },
    };

    this.actions = [
      {
        priority: PRIORITY_INVESTIGATIVE_DEFAULT,
        run: function () {
          if (!this.actor.alive) return;
          if (this.game.getStateName() != "Night") return;
          if (!this.actor.role.begumTarget) return;

          let begumTarget = this.actor.role.begumTarget;
          let visits = this.getVisits(begumTarget);
          let visitNames = visits.map((p) => p.name);
          let visitors = this.getVisitors(begumTarget);
          let visitorNames = visitors.map((p) => p.name);

          if (visitNames.length == 0) visitNames.push("no one");
          if (visitorNames.length === 0) visitorNames.push("no one");

          this.actor.queueAlert(
            `:look: Your target was visited by ${visitorNames.join(
              ", "
            )} during the night.`
          );

          this.actor.queueAlert(
            `:look: Your target visited ${visitNames.join(
              ", "
            )} during the night.`
          );
        },
      },
    ];

    this.listeners = {
      roleAssigned: function (player) {
        if (player !== this.player) return;
        let possibleTargets = this.game
          .alivePlayers()
          .filter((p) => p != this.player);
        this.begumTarget = Random.randArrayVal(possibleTargets);
      },
    };
  }
};
