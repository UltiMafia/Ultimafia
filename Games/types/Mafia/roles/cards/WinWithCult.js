const Card = require("../../Card");
const {
  PRIORITY_WIN_CHECK_DEFAULT,
  PRIORITY_SUNSET_DEFAULT,
} = require("../../const/Priority");

module.exports = class WinWithCult extends Card {
  constructor(role) {
    super(role);

    this.winCheck = {
      priority: PRIORITY_WIN_CHECK_DEFAULT,
      check: function (counts, winners, aliveCount) {
        function cultWin(role) {
          winners.addPlayer(
            role.player,
            role.alignment === "Cult" ? "Cult" : role.name
          );
        }

        const soldiersInGame = this.game.players.filter(
          (p) => p.role.name == "Soldier"
        );

        if (soldiersInGame.length > 0) {
          if (soldiersInGame.length == aliveCount / 2 && aliveCount > 0) {
            // soldiers are present, cult cannot win
            return;
          }
        }

        // win with carbonaro
        const numCarbonariAlive = this.game.players.filter(
          (p) => p.alive && p.role.name == "Carbonaro"
        ).length;
        if (numCarbonariAlive > 0 && winners.groups["Mafia"]) {
          cultWin(this);
          return;
        }

        // win by majority
        const hasMajority =
          counts["Cult"] + numCarbonariAlive >= aliveCount / 2 &&
          aliveCount > 0;
        if (hasMajority) {
          cultWin(this);
          return;
        }

        const numOccultistsAlive = this.game.players.filter(
          (p) => p.alive && p.role.name == "Occultist"
        ).length;
        if (
          counts["Cult"] + numCarbonariAlive + numOccultistsAlive ==
          aliveCount
        ) {
          cultWin(this);
          return;
        }
      },
    };
    this.listeners = {
      roleAssigned: function (player) {
        if (player !== this.player) return;

        if (this.oblivious["Cult"]) return;

        for (let player of this.game.players) {
          if (
            player.role.alignment === "Cult" &&
            player !== this.player &&
            player.role.name !== "Politician" &&
            !player.role.oblivious["self"]
          ) {
            this.revealToPlayer(player);
          }
        }
      },
    };

    this.stateMods = {
      Day: {
        type: "delayActions",
        delayActions: true,
      },
      Overturn: {
        type: "delayActions",
        delayActions: true,
      },
      Sunset: {
        type: "add",
        index: 5,
        length: 1000 * 30,
        shouldSkip: function () {
          for (let action of this.game.actions[0])
            if (action.target == this.player && action.hasLabel("condemn"))
              return false;

          return true;
        },
      },
    };
  }
};
