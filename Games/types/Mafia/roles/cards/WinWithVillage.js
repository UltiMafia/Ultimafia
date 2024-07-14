const Card = require("../../Card");
const { PRIORITY_WIN_CHECK_DEFAULT } = require("../../const/Priority");

module.exports = class WinWithVillage extends Card {
  constructor(role) {
    super(role);

    this.winCheck = {
      priority: PRIORITY_WIN_CHECK_DEFAULT,
      check: function (counts, winners, aliveCount) {
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

        if (counts.Village == aliveCount && aliveCount > 0) {
          winners.addPlayer(this.player, "Village");
          return;
        }

        if (
          this.game.alivePlayers().filter((p) => p.role.name === "Soldier")
            .length >=
            aliveCount / 2 &&
          aliveCount > 0
        ) {
          winners.addPlayer(this.player, "Village");
          return;
        }
        const aliveMayors = this.game.alivePlayers().filter((p) => p.role.name === "Mayor");
        if (aliveMayors.length > 0 && aliveCount == 3) {

          if(aliveMayors [0].role.data.MayorWin == 3){
            winners.addPlayer(this.player, "Village");
            return;
            }


            if(this.game.getStateName() == "Night"){
              if(aliveMayors [0].role.data.MayorWin == 2){
                winners.addPlayer(this.player, "Village");
                return;
                }
            }
            if(this.game.getStateName() == "Day" && aliveMayors [0].role.data.MayorWin == 1){
                aliveMayors [0].role.data.MayorWin = 2;   
            }
        }
      },
    };
  }
};
