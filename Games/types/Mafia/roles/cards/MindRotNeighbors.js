const Card = require("../../Card");
const Random = require("../../../../../lib/Random");
const { PRIORITY_NIGHT_ROLE_BLOCKER } = require("../../const/Priority");

module.exports = class MindRotNeighbors extends Card {
  constructor(role) {
    super(role);

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
            let actionCount = false;
            for (let action of this.game.actions[0]) {
              if (
                action.actor === victims[x] &&
                !action.hasLabel("investigate")
              ) {
                //action.cancelActor(target);
                this.blockActions(victims[x]);
              } else if (
                action.actor === victims[x] &&
                action.hasLabel("investigate")
              ) {
                actionCount = true;
              }
            }

            if (actionCount) {
              let visits = this.getVisits(victims[x]);

              let alive = this.game.alivePlayers();

              var evilPlayers = alive.filter(
                (p) => p.role.alignment == "Mafia" || p.role.alignment == "Cult"
              );
              var goodPlayers = alive.filter(
                (p) => p.role.alignment != "Mafia" && p.role.alignment != "Cult"
              );

              if (visits.length == 0) {
                //let neighbors = this.target.getAliveNeighbors();
                let index = alive.indexOf(victims[x]);
                leftIdx = (index - 1 + alive.length) % alive.length;
                rightIdx = (index + 1) % alive.length;
                let neighbors = [alive[leftIdx], alive[rightIdx]];

                let neighborTarget = Random.randArrayVal(neighbors);
                if (
                  neighborTarget.role.alignment == "Village" &&
                  this.actor.role.alignment != "Village"
                ) {
                  neighborTarget.setTempAppearance(
                    "investigate",
                    this.actor.role.name
                  );
                } else if (neighborTarget.role.alignment != "Village") {
                  neighborTarget.setTempAppearance(
                    "investigate",
                    Random.randArrayVal(goodPlayers).role.name
                  );
                } else {
                  neighborTarget.setTempAppearance(
                    "investigate",
                    Random.randArrayVal(evilPlayers).role.name
                  );
                }
              } else {
                for (let visit of visits) {
                  if (
                    visit.role.alignment == "Village" &&
                    this.actor.role.alignment != "Village"
                  ) {
                    visit.setTempAppearance(
                      "investigate",
                      this.actor.role.name
                    );
                  } else if (visit.role.alignment != "Village") {
                    visit.setTempAppearance(
                      "investigate",
                      Random.randArrayVal(goodPlayers).role.name
                    );
                  } else {
                    visit.setTempAppearance(
                      "investigate",
                      Random.randArrayVal(evilPlayers).role.name
                    );
                  }
                }
              }
            }
          } //End for loop
        },
      },
    ];
  }
};
