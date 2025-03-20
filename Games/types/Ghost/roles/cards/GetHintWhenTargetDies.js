const Card = require("../../Card");
const Random = require("../../../../../lib/Random");

module.exports = class GetHintWhenTargetDies extends Card {
  constructor(role) {
    super(role);
    this.target = "";

    this.listeners = {
      roleAssigned: function (player) {
        if (player !== this.player) {
          return;
        }
        const nonGhost = this.game.players.filter(
          (p) =>
            (p.role.alignment === "Town") &&
            p.alive &&
            p !== this.player
        );
        this.target = Random.randArrayVal(nonGhost);
        this.player.queueAlert(
          `If you get ${this.target.name} condemned you will learn a letter in the Word.`
        );
      },
      death: function (player, killer, deathType) {
        if (
          player === this.target &&
          deathType === "condemn" &&
          this.player.alive
        ) {
          this.player.queueAlert(`You learn that the Word contains the letter ${this.game.townWord[Math.floor(Math.random() * this.game.townWord.length)]}.`);
        }
      },
    };
  }
};
