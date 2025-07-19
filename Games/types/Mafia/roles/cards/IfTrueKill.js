const Card = require("../../Card");
const { PRIORITY_INVESTIGATIVE_DEFAULT } = require("../../const/Priority");
const Action = require("../../Action");
const Random = require("../../../../../lib/Random");
const { PRIORITY_KILL_DEFAULT } = require("../../const/Priority");

module.exports = class LearnAboutPlayerAndRole extends Card {
  constructor(role) {
    super(role);

    (this.meetings = {
      "Select Players": {
        actionName: "Select Player",
        states: ["Day"],
        flags: ["voting", "instant"],
        targets: { include: ["alive", "self"] },
        action: {
          labels: ["investigate", "role"],
          priority: PRIORITY_INVESTIGATIVE_DEFAULT - 2,
          role: this.role,
          run: function () {
            this.role.data.targetPlayer = this.target;
          },
        },
      },
      "Select Relation": {
        actionName: "Select Relation",
        states: ["Day"],
        flags: ["voting", "instant"],
        inputType: "custom",
        targets: ["Is", "Neighbors", "Was Visited By", "Has Visited"],
        action: {
          role: this.role,
          labels: ["investigate"],
          priority: PRIORITY_INVESTIGATIVE_DEFAULT - 1,
          run: function () {
            this.role.data.targetRealation = this.target;
          },
        },
      },
      "Select Role": {
        actionName: "Select Role",
        states: ["Day"],
        flags: ["voting", "instant"],
        inputType: "custom",
        action: {
          role: this.role,
          labels: ["investigate", "role"],
          priority: PRIORITY_INVESTIGATIVE_DEFAULT - 1,
          run: function () {
            this.role.data.targetRole = this.target;
          },
        },
      },
      "Ask Question": {
        states: ["Day"],
        flags: ["voting", "instant"],
        inputType: "boolean",
        action: {
          role: this.role,
          labels: ["investigate"],
          priority: PRIORITY_INVESTIGATIVE_DEFAULT,
          run: function () {
            if (this.target === "No") return;

            if (!this.role.data.targetPlayer) return;
            if (!this.role.data.targetRealation) return;
            if (!this.role.data.targetRole) return;
            if (this.role.data.targetPlayer == "No One") return;
            if (this.role.data.targetRole == "None") return;

            let isCorrect = true;
            let question = "";

            if (this.role.data.targetRealation == "Is") {
              question = `You ask if ${this.role.data.targetPlayer.name} Is ${this.role.data.targetRole}?`;
              let playerRole = this.role.data.targetPlayer.role.name;
              if (this.role.data.targetRole == playerRole) {
                isCorrect = true;
              } else {
                isCorrect = false;
              }
            } else if (this.role.data.targetRealation == "Neighbors") {
              question = `You ask if ${this.role.data.targetPlayer.name} Neighbors ${this.role.data.targetRole}?`;
              let alivePlayers = this.game.alivePlayers();
              let index = alivePlayers.indexOf(
                this.role.data.targetPlayer
              );
              let rightIdx = (index + 1) % alivePlayers.length;
              let leftIdx =
                (index - 1 + alivePlayers.length) % alivePlayers.length;
              let neighborRoles = [
                alivePlayers[rightIdx].role.name,
                alivePlayers[leftIdx].role.name,
              ];
              if (
                this.role.data.targetRole == neighborRoles[0] ||
                this.role.data.targetRole == neighborRoles[1]
              ) {
                isCorrect = true;
              } else {
                isCorrect = false;
              }
            } else if (
              this.role.data.targetRealation == "Was Visited By"
            ) {
              question = `You ask if ${this.role.data.targetPlayer.name} Was Visited By ${this.role.data.targetRole}?`;

              let lastVisitorsAll = this.role.data.LastNightVisitors;
              let nightPlayers = this.role.data.LastNightPlayers;
              let indexOfTarget = nightPlayers.indexOf(
                this.role.data.targetPlayer
              );
              let lastVisitors = lastVisitorsAll[indexOfTarget];
              isCorrect = false;

              for (let y = 0; y < lastVisitors.length; y++) {
                if (lastVisitors[y].name == this.role.data.targetRole) {
                  isCorrect = true;
                }
              }
            } else if (this.role.data.targetRealation == "Has Visited") {
              question = `You ask if ${this.role.data.targetPlayer.name} Has Visited ${this.role.data.targetRole}?`;

              let lastVisitsAll = this.role.data.LastNightVisits;
              let nightPlayers = this.role.data.LastNightPlayers;
              let indexOfTarget = nightPlayers.indexOf(
                this.role.data.targetPlayer
              );
              let lastVisits = lastVisitsAll[indexOfTarget];
              isCorrect = false;

              for (let y = 0; y < lastVisits.length; y++) {
                if (lastVisits[y].name == this.role.data.targetRole) {
                  isCorrect = true;
                }
              }
            }

            this.actor.queueAlert(question);
            this.actor.queueAlert(
              `If the Answer is yes you will kill a random player Tonight.`
            );
            this.role.data.WasStatementTrue = isCorrect;
            delete this.role.data.targetPlayer;
            delete this.role.data.targetRealation;
            delete this.role.data.targetRole;
          },
        },
      },
    }),
      /*
      (this.actions = [
        {
          priority: PRIORITY_INVESTIGATIVE_DEFAULT,
          labels: ["hidden", "absolute", "investigate"],
          run: function () {
            if (!this.actor.alive) return;
            if (this.game.getStateName() != "Night") return;

            let alivePlayers = this.game.players.filter((p) => p.role);
            let allVisits = [];
            let allVisitors = [];

            for (let x = 0; x < alivePlayers.length; x++) {
              let visits = this.getVisits(alivePlayers[x]);
              let visitNames = visits.map((p) => p.role);
              let visitors = this.getVisitors(alivePlayers[x]);
              let visitorNames = visitors.map((p) => p.role);
              allVisits.push(visitNames);
              allVisitors.push(visitorNames);
            }

            this.actor.role.data.LastNightVisits = allVisits;
            this.actor.role.data.LastNightVisitors = allVisitors;
            this.actor.role.data.LastNightPlayers = alivePlayers;
          },
        },
        {
          priority: PRIORITY_KILL_DEFAULT - 2,
          labels: ["hidden", "kill"],
          run: function () {
            if (!this.actor.alive) return;
            if (this.game.getStateName() != "Night") return;
            if (this.actor.role.data.WasStatementTrue != true) {
              return;
            }

            let alivePlayers = this.game.players.filter((p) => p.role);
            let goodPlayers = alivePlayers.filter(
              (p) =>
                p.role.alignment == "Village" ||
                p.role.alignment == "Independent"
            );
            let shuffledPlayers = Random.randomizeArray(goodPlayers);

            shuffledPlayers[0].kill("basic", this.actor);
          },
        },
      ]);
*/
      (this.listeners = {
        roleAssigned: function (player) {
          if (player !== this.player) {
            return;
          }

          this.data.ConvertOptions = this.game.PossibleRoles.map(
            (r) => r.split(":")[0]
          );
        },
        // refresh cooldown
        state: function (stateInfo) {
          if (stateInfo.name.match(/Day/)) {
            var ConvertOptions = this.data.ConvertOptions;
            ConvertOptions.push("None");
            this.meetings["Select Role"].targets = ConvertOptions;
          }
          if (stateInfo.name.match(/Night/)) {
            var action = new Action({
              actor: this.player,
              game: this.player.game,
              role: this,
              priority: PRIORITY_INVESTIGATIVE_DEFAULT,
              labels: ["hidden", "absolute", "investigate"],
              run: function () {
                if (!this.actor.alive) return;

                let alivePlayers = this.game.players.filter((p) => p.role);
                let allVisits = [];
                let allVisitors = [];

                for (let x = 0; x < alivePlayers.length; x++) {
                  let visits = this.getVisits(alivePlayers[x]);
                  let visitNames = visits.map((p) => p.role);
                  let visitors = this.getVisitors(alivePlayers[x]);
                  let visitorNames = visitors.map((p) => p.role);
                  allVisits.push(visitNames);
                  allVisitors.push(visitorNames);
                }

                this.role.data.LastNightVisits = allVisits;
                this.role.data.LastNightVisitors = allVisitors;
                this.role.data.LastNightPlayers = alivePlayers;
              },
            });

            var action2 = new Action({
              actor: this.player,
              game: this.player.game,
              role: this,
              priority: PRIORITY_KILL_DEFAULT - 2,
              labels: ["hidden", "kill"],
              run: function () {
                if (!this.actor.alive) return;
                if (this.role.data.WasStatementTrue != true) {
                  return;
                }

                let alivePlayers = this.game.players.filter((p) => p.role);
                let goodPlayers = alivePlayers.filter(
                  (p) =>
                    p.role.alignment == "Village" ||
                    p.role.alignment == "Independent"
                );
                let shuffledPlayers = Random.randomizeArray(goodPlayers);

                shuffledPlayers[0].kill("basic", this.actor);
              },
            });

            this.game.queueAction(action);
            this.game.queueAction(action2);
          }
        },
      });
  }
};
