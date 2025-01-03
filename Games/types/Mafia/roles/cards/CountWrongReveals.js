const Card = require("../../Card");
const Action = require("../../Action");
const {
  PRIORITY_INVESTIGATIVE_AFTER_RESOLVE_DEFAULT,
} = require("../../const/Priority");

module.exports = class CountWrongReveals extends Card {
  constructor(role) {
    super(role);
    /*
    this.actions = [
      {
        priority: PRIORITY_INVESTIGATIVE_AFTER_RESOLVE_DEFAULT - 1,
        labels: ["investigate"],
        run: function () {
          if (this.game.getStateName() != "Night") return;
          if (!this.actor.alive) return;
          //let visitors;
          let problemCount = 0;
          let role;
          let appearRole;
          let isFalse;

          let players = this.game.players.filter((p) => p.role);
          for (let x = 0; x < players.length; x++) {
            //visitors = this.getVisits(players[x]);
            role = players[x].role.name;
            appearRole = players[x].getRoleAppearance().split(" (")[0];
            isFalse = false;

            for (let action of this.game.actions[0]) {
              if (
                action.actor == players[x] &&
                action.hasLabel("investigate") &&
                players[x].hasEffect("FalseMode")
              ) {
                isFalse = true;
              }
            }

            if (role != appearRole) {
              problemCount = problemCount + 1;
            }
            if (isFalse) {
              problemCount = problemCount + 1;
            }
          }

          if (this.actor.hasEffect("FalseMode")) {
            if (problemCount == 0) {
              problemCount = 1;
            } else {
              problemCount = 0;
            }
          }

          this.actor.queueAlert(
            `You learn that ${problemCount} problems occured during the night.`
          );
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
          priority: PRIORITY_INVESTIGATIVE_AFTER_RESOLVE_DEFAULT+2,
          labels: ["investigate"],
          run: function () {
            if (!this.actor.alive) return;
            //let visitors;
            let problemCount = 0;
            let role;
            let appearRole;
            let isFalse;

            let players = this.game.players.filter((p) => p.role);
            for (let x = 0; x < players.length; x++) {
              //visitors = this.getVisits(players[x]);
              role = players[x].role.name;
              appearRole = players[x].getRoleAppearance().split(" (")[0];
              isFalse = false;

              for (let action of this.game.actions[0]) {
                if (
                  action.actor == players[x] &&
                  action.hasLabel("investigate") &&
                  players[x].hasEffect("FalseMode")
                ) {
                  isFalse = true;
                }
              }

              if (role != appearRole) {
                problemCount = problemCount + 1;
              }
              if (isFalse) {
                problemCount = problemCount + 1;
              }
            }

            if (this.actor.hasEffect("FalseMode")) {
              if (problemCount == 0) {
                problemCount = 1;
              } else {
                problemCount = 0;
              }
            }

            this.actor.queueAlert(
              `You learn that ${problemCount} problems occured during the night.`
            );
          },
        });

        this.game.queueAction(action);
      },
    };
  }
};
