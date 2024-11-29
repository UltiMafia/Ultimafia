const Card = require("../../Card");
const Action = require("../../Action");
const Random = require("../../../../../lib/Random");
const { PRIORITY_NIGHT_ROLE_BLOCKER } = require("../../const/Priority");

module.exports = class MindRotNeighbors extends Card {
  constructor(role) {
    super(role);
    /*
    this.actions = [
      {
        priority: PRIORITY_NIGHT_ROLE_BLOCKER,
        labels: ["block"],
        run: function () {
          if (this.game.getStateName() != "Night") return;

          if (!this.actor.alive) return;

          let players = this.game.alivePlayers();
          var indexOfActor = players.indexOf(this.actor);
          var rightIdx;
          var leftIdx;
          var leftAlign;
          var rightAlign;
          var distance = 0;
          var foundUp = 0;
          var foundDown = 0;

          for (let x = 0; x < players.length; x++) {
            leftIdx =
              (indexOfActor - distance - 1 + players.length) % players.length;
            rightIdx = (indexOfActor + distance + 1) % players.length;
            leftAlign = players[leftIdx].role.alignment;
            rightAlign = players[rightIdx].role.alignment;

            if (
              rightAlign == "Village" &&
              !players[rightIdx].role.data.banished &&
              foundUp == 0
            ) {
              foundUp = players[rightIdx];
            }
            if (
              leftAlign == "Village" &&
              !players[leftIdx].role.data.banished &&
              foundDown == 0
            ) {
              foundDown = players[leftIdx];
            }
            if (foundUp == 0 || foundDown == 0) {
              distance = x;
            } else {
              break;
            }
          }

          let victims = [foundUp, foundDown];

          for (let x = 0; x < victims.length; x++) {
            if (this.dominates(victims[x])) {
              this.blockWithMindRot(victims[x]);
            }
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
          priority: PRIORITY_NIGHT_ROLE_BLOCKER,
          labels: ["block"],
          run: function () {
            if (!this.actor.alive) return;

            let players = this.game.alivePlayers();
            var indexOfActor = players.indexOf(this.actor);
            var rightIdx;
            var leftIdx;
            var leftAlign;
            var rightAlign;
            var distance = 0;
            var foundUp = 0;
            var foundDown = 0;

            for (let x = 0; x < players.length; x++) {
              leftIdx =
                (indexOfActor - distance - 1 + players.length) % players.length;
              rightIdx = (indexOfActor + distance + 1) % players.length;
              leftAlign = players[leftIdx].role.alignment;
              rightAlign = players[rightIdx].role.alignment;

              if (
                rightAlign == "Village" &&
                !players[rightIdx].role.data.banished &&
                foundUp == 0
              ) {
                foundUp = players[rightIdx];
              }
              if (
                leftAlign == "Village" &&
                !players[leftIdx].role.data.banished &&
                foundDown == 0
              ) {
                foundDown = players[leftIdx];
              }
              if (foundUp == 0 || foundDown == 0) {
                distance = x;
              } else {
                break;
              }
            }

            let victims = [foundUp, foundDown];

            for (let x = 0; x < victims.length; x++) {
              if (this.dominates(victims[x])) {
                this.blockWithMindRot(victims[x]);
              }
            }
          },
        });

        this.game.queueAction(action);
      },
    };
  }
};
