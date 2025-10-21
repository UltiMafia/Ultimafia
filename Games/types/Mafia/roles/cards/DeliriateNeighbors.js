const Card = require("../../Card");
const Action = require("../../Action");
const Random = require("../../../../../lib/Random");
const { PRIORITY_NIGHT_ROLE_BLOCKER } = require("../../const/Priority");

module.exports = class DeliriateNeighbors extends Card {
  constructor(role) {
    super(role);

    this.listeners = {
      state: function (stateInfo) {
        if (!this.hasAbility(["Effect"])) {
          return;
        }

        if (!stateInfo.name.match(/Night/)) {
          return;
        }

        var action = new Action({
          actor: this.player,
          game: this.player.game,
          role: this,
          priority: PRIORITY_NIGHT_ROLE_BLOCKER + 1,
          labels: ["block", "delirium"],
          run: function () {
            for (let player of this.role.startingNeighbors) {
              if (
                player.effects.filter(
                  (e) => e.name == "Delirious" && e.source == this.role
                ).length <= 0
              ) {
                if (this.dominates(player)) {
                  let effect = this.role.giveEffect(
                    player,
                    "Delirious",
                    this.actor,
                    Infinity,
                    null,
                    this.role
                  );
                  this.blockWithDelirium(player, true);
                }
              }
            }
          },
        });

        this.game.queueAction(action);
      },
      AbilityToggle: function (player) {
        if (this.startingNeighbors) {
          return;
        }
        if (this.hasAbility(["Deception"])) {
          if (this.startingNeighbors == null) {
            let players = this.game.alivePlayers();
            var indexOfActor = players.indexOf(this.player);
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
            this.startingNeighbors = victims;
          }
          for (let player of this.startingNeighbors) {
            let effect = this.giveEffect(
              player,
              "Delirious",
              this.player,
              Infinity,
              null,
              this
            );
          }
        }
      },
    };
  }
};
