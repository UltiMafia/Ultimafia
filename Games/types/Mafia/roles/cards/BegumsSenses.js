const Card = require("../../Card");
const Action = require("../../Action");
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

            let info = this.game.createInformation(
              "LearnTargetInfo",
              this.actor,
              this.game,
              this.actor.role.begumTarget
            );
            info.processInfo();
            this.actor.queueAlert(
              `You learn that your target was ${info.getInfoRaw().name}!`
            );

            delete this.actor.role.begumTarget;
          },
        },
        shouldMeet() {
          return this.begumTarget;
        },
      },
    };

    this.passiveActions = [
      {
        ability: ["Information"],
        state: "Night",
        actor: role.player,
        game: role.player.game,
        priority: PRIORITY_INVESTIGATIVE_DEFAULT,
        labels: ["investigate"],
        role: role,
        run: function () {
          if (this.game.getStateName() != "Night") return;
          if (!this.actor.role.begumTarget) return;

          let begumTarget = this.actor.role.begumTarget;

          let info = this.game.createInformation(
            "WatcherInfo",
            this.actor,
            this.game,
            begumTarget
          );
          info.processInfo();
          let info2 = this.game.createInformation(
            "TrackerInfo",
            this.actor,
            this.game,
            begumTarget
          );
          info2.processInfo();
          let visitorNames = info.getInfoRaw();
          let visitNames = info2.getInfoRaw();
          visitorNames = visitorNames.map((p) => p.name);
          visitNames = visitNames.map((p) => p.name);
          if (visitNames.length == 0) visitNames.push("no one");
          if (visitorNames.length == 0) visitorNames.push("no one");

          this.actor.queueAlert(
            `:watch: Your target was visited by ${visitorNames.join(
              ", "
            )} during the night.`
          );

          this.actor.queueAlert(
            `:track: Your target visited ${visitNames.join(
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
