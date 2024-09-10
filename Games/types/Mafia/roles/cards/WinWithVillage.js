const Card = require("../../Card");
const { PRIORITY_WIN_CHECK_DEFAULT } = require("../../const/Priority");

module.exports = class WinWithVillage extends Card {
  constructor(role) {
    super(role);

    this.winCheck = {
      priority: PRIORITY_WIN_CHECK_DEFAULT,
      check: function (counts, winners, aliveCount) {
        function villageWin(role) {
          winners.addPlayer(role.player, "Village");
        }

        let lunatics = this.game.players.filter((p) =>
          p.hasItem("IsTheTelevangelist")
        );

        const seersInGame = this.game.players.filter(
          (p) => p.role.name == "Seer"
        );
        if (seersInGame.length > 0) {
          if (
            seersInGame.length == this.game.guessedSeers["Mafia"]?.length ||
            seersInGame.length == this.game.guessedSeers["Cult"]?.length
          ) {
            // seers have been guessed, village cannot win
            return;
          }
        }

        const magusInGame = this.game.players.filter(
          (p) => p.role.name == "Magus" && !p.role.data.MagusWin
        );
        const mafiaCultInGame = this.game.players.filter(
          (p) =>
            (p.role.alignment == "Mafia" || p.role.alignment == "Cult") &&
            p.role.name != "Magus"
        );
        if (magusInGame.length > 0 && mafiaCultInGame.length <= 0) {
          // Magus in Game Town Can't Win
          return;
        }

        const deadPoltergeist = this.game
          .deadPlayers()
          .filter((p) => p.role.name === "Poltergeist" && !p.exorcised);
        if (deadPoltergeist.length > 0) {
          // Poltergeist in Graveyard Town Can't Win
          return;
        }

        if (counts.Village == aliveCount && aliveCount > 0) {
          villageWin(this);
          if (lunatics.length <= 0) return;
          for (let x = 0; x < lunatics.length; x++) {
            if (
              !Object.values(winners.groups)
                .flat()
                .find((p) => p == lunatics[x])
            ) {
              winners.addPlayer(lunatics[x], "Village");
            }
          }
          return;
        }

        if (
          this.game.alivePlayers().filter((p) => p.role.name === "Soldier")
            .length >=
            aliveCount / 2 &&
          aliveCount > 0
        ) {
          villageWin(this);
          if (lunatics.length <= 0) return;
          for (let x = 0; x < lunatics.length; x++) {
            if (
              !Object.values(winners.groups)
                .flat()
                .find((p) => p == lunatics[x])
            ) {
              winners.addPlayer(lunatics[x], "Village");
            }
          }
          return;
        }

        if (
          this.game
            .alivePlayers()
            .filter((p) => p.role.name === "Shoggoth" && !p.role.revived)
            .length > 0 &&
          counts["Cult"] >= aliveCount / 2 &&
          aliveCount > 0
        ) {
          villageWin(this);
          if (lunatics.length <= 0) return;
          for (let x = 0; x < lunatics.length; x++) {
            if (
              !Object.values(winners.groups)
                .flat()
                .find((p) => p == lunatics[x])
            ) {
              winners.addPlayer(lunatics[x], "Village");
            }
          }
          return;
        }
        const aliveMayors = this.game
          .alivePlayers()
          .filter((p) => p.role.name === "Mayor" && p.role.data.MayorWin);
        if (aliveMayors.length > 0 && aliveCount == 3) {
          if (
            this.game.getStateName() == "Day" &&
            aliveMayors[0].role.data.MayorWin
          ) {
            villageWin(this);
            if (lunatics.length <= 0) return;
            for (let x = 0; x < lunatics.length; x++) {
              if (
                !Object.values(winners.groups)
                  .flat()
                  .find((p) => p == lunatics[x])
              ) {
                winners.addPlayer(lunatics[x], "Village");
              }
            }
            return;
          }
        }
      },
    };
  }
};
