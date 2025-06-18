const Card = require("../../Card");
const Action = require("../../Action");
const { PRIORITY_INVESTIGATIVE_DEFAULT } = require("../../const/Priority");

module.exports = class LearnAboutPlayerAndRole extends Card {
  constructor(role) {
    super(role);

    (this.meetings = {
      "Select Players": {
        actionName: "Select Player",
        states: ["Day"],
        flags: ["voting", "instant"],
        targets: { include: ["alive", "self"] },
        shouldMeet: function () {
          return !this.revived;
        },
        action: {
          labels: ["investigate", "role"],
          priority: PRIORITY_INVESTIGATIVE_DEFAULT - 2,
          run: function () {
            this.actor.role.data.targetPlayer = this.target;
          },
        },
      },
      "Select Relation": {
        actionName: "Select Relation",
        states: ["Day"],
        flags: ["voting", "instant"],
        inputType: "custom",
        targets: ["Is", "Neighbors", "Was Visited By", "Has Visited"],
        shouldMeet: function () {
          return !this.revived;
        },
        action: {
          labels: ["investigate"],
          priority: PRIORITY_INVESTIGATIVE_DEFAULT - 1,
          run: function () {
            this.actor.role.data.targetRelation = this.target;
          },
        },
      },
      "Select Role": {
        actionName: "Select Role",
        states: ["Day"],
        flags: ["voting", "instant"],
        inputType: "AllRoles",
        AllRolesFilters: ["addedRoles"],
        shouldMeet: function () {
          return !this.revived;
        },
        action: {
          labels: ["investigate", "role"],
          priority: PRIORITY_INVESTIGATIVE_DEFAULT - 1,
          run: function () {
            this.actor.role.data.targetRole = this.target;
          },
        },
      },
      "Ask Question": {
        states: ["Day"],
        flags: ["voting", "instant"],
        inputType: "boolean",
        shouldMeet: function () {
          return !this.revived;
        },
        action: {
          labels: ["investigate"],
          priority: PRIORITY_INVESTIGATIVE_DEFAULT,
          run: function () {
            if (this.target === "No") return;

            if (!this.actor.role.data.targetPlayer) return;
            if (!this.actor.role.data.targetRelation) return;
            if (!this.actor.role.data.targetRole) return;
            if (this.actor.role.data.targetPlayer == "No One") return;
            if (this.actor.role.data.targetRole == "None") return;
            this.actor.role.revived = true;

            let isCorrect = true;
            let question = "";

            let info = this.game.createInformation(
              "PlayerRoleRelationInfo",
              this.actor,
              this.game,
              this.actor.role.data.targetPlayer,
              this.actor.role.data.targetRole,
              this.actor.role.data.targetRelation
            );
            info.processInfo();
            info.getGuessMessages();
            this.actor.queueAlert(`:invest: ${info.getInfoFormated()}`);

            /*
            if (this.actor.role.data.targetRelation == "Is") {
              question = `You ask if ${this.actor.role.data.targetPlayer.name} Is ${this.actor.role.data.targetRole}?`;
              let playerRole = this.actor.role.data.targetPlayer.role.name;
              if (this.actor.role.data.targetRole == playerRole) {
                isCorrect = true;
              } else {
                isCorrect = false;
              }
            } else if (this.actor.role.data.targetRelation == "Neighbors") {
              question = `You ask if ${this.actor.role.data.targetPlayer.name} Neighbors ${this.actor.role.data.targetRole}?`;
              let alivePlayers = this.game.alivePlayers();
              let index = alivePlayers.indexOf(
                this.actor.role.data.targetPlayer
              );
              let rightIdx = (index + 1) % alivePlayers.length;
              let leftIdx =
                (index - 1 + alivePlayers.length) % alivePlayers.length;
              let neighborRoles = [
                alivePlayers[rightIdx].role.name,
                alivePlayers[leftIdx].role.name,
              ];
              if (
                this.actor.role.data.targetRole == neighborRoles[0] ||
                this.actor.role.data.targetRole == neighborRoles[1]
              ) {
                isCorrect = true;
              } else {
                isCorrect = false;
              }
            } else if (
              this.actor.role.data.targetRelation == "Was Visited By"
            ) {
              question = `You ask if ${this.actor.role.data.targetPlayer.name} Was Visited By ${this.actor.role.data.targetRole}?`;

              let lastVisitorsAll = this.actor.role.data.LastNightVisitors;
              let nightPlayers = this.actor.role.data.LastNightPlayers;
              let indexOfTarget = nightPlayers.indexOf(
                this.actor.role.data.targetPlayer
              );
              let lastVisitors = lastVisitorsAll[indexOfTarget];
              isCorrect = false;

              for (let y = 0; y < lastVisitors.length; y++) {
                if (lastVisitors[y].name == this.actor.role.data.targetRole) {
                  isCorrect = true;
                }
              }
            } else if (this.actor.role.data.targetRelation == "Has Visited") {
              question = `You ask if ${this.actor.role.data.targetPlayer.name} Has Visited ${this.actor.role.data.targetRole}?`;

              let lastVisitsAll = this.actor.role.data.LastNightVisits;
              let nightPlayers = this.actor.role.data.LastNightPlayers;
              let indexOfTarget = nightPlayers.indexOf(
                this.actor.role.data.targetPlayer
              );
              let lastVisits = lastVisitsAll[indexOfTarget];
              isCorrect = false;

              for (let y = 0; y < lastVisits.length; y++) {
                if (lastVisits[y].name == this.actor.role.data.targetRole) {
                  isCorrect = true;
                }
              }
            }

            if (this.actor.hasEffect("FalseMode")) {
              if (isCorrect) {
                isCorrect = false;
              } else {
                isCorrect = true;
              }
            }
            this.actor.queueAlert(question);
            if (isCorrect) {
              this.actor.queueAlert(
                `After checking your notes your Learn that the Answer is YES!`
              );
            } else {
              this.actor.queueAlert(
                `After checking your notes your Learn that the Answer is NO.`
              );
            }
            */
            delete this.actor.role.data.targetPlayer;
            delete this.actor.role.data.targetRelation;
            delete this.actor.role.data.targetRole;
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
      ]);
*/

      (this.listeners = {
        roleAssigned: function (player) {
          if (player !== this.player) {
            return;
          }

          this.data.ConvertOptions = this.game.PossibleRoles.filter((r) => r);
        },
        // refresh cooldown
        /*
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

                this.actor.role.data.LastNightVisits = allVisits;
                this.actor.role.data.LastNightVisitors = allVisitors;
                this.actor.role.data.LastNightPlayers = alivePlayers;
              },
            });

            this.game.queueAction(action);
            //this.game.queueAction(action2);
          }
        },
        */
      });
      
  }
};
