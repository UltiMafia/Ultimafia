const Card = require("../../Card");
const Action = require("../../Action");
const Random = require("../../../../../lib/Random");
const { PRIORITY_NIGHT_ROLE_BLOCKER } = require("../../const/Priority");

module.exports = class DeliriateNeighbors extends Card {
  constructor(role) {
    super(role);

    this.passiveActions = [
      {
        ability: ["Effect", "Delirium"],
        state: "Night",
        actor: role.player,
        game: role.player.game,
        priority: PRIORITY_NIGHT_ROLE_BLOCKER + 1,
        labels: ["block", "delirium"],
        role: role,
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
      },
    ];

    const card = this;

    function calculateStartingNeighbors() {
      if (!role.game.started) {
        return;
      }
      if (role.startingNeighbors) {
        return;
      }
      if (role.hasAbility(["Deception"])) {
        if (role.startingNeighbors == null) {
          let players = role.game.alivePlayers();
          var indexOfActor = players.indexOf(role.player);
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
            leftAlign = players[leftIdx].getRoleAlignment();
            rightAlign = players[rightIdx].getRoleAlignment();

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
          role.startingNeighbors = victims;
        }
        for (let player of role.startingNeighbors) {
          role.giveEffect(
            player,
            "Delirious",
            role.player,
            Infinity,
            null,
            role
          );
        }
      }
    }

    this.listeners = {
      start: function () {
        calculateStartingNeighbors();
      },
      AbilityToggle: function (player) {
        calculateStartingNeighbors();
      },
    };
  }
};
