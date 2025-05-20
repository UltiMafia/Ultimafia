const Card = require("../../Card");
const Winners = require("../../../../core/Winners");

module.exports = class AssassinGuess extends Card {
  constructor(role) {
    super(role);

    this.meetings = {
      "Assassinate Merlin": {
        states: ["Epilogue"],
        flags: ["group", "voting", "mustAct"],
        targetType: "player",
        targets: { include: ["Resistance"], exclude: [""] },
        canVote: false,
        action: {
          run: function () {
            const winnerGroup =
              this.target.role.name === "Merlin" ? "Spies" : "Resistance";
            const winners = new Winners(this.game);
            winners.addGroup(winnerGroup);
            for (let player of this.game.players) {
              if (player.role.alignment !== winnerGroup) {
                player.kill();
              } else {
                winners.addPlayer(player);
              }
            }
            this.game.endGame(winners);
          },
        },
      },
    };
  }
};
