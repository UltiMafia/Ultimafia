const Card = require("../../Card");
const Random = require("../../../../../lib/Random");
const Action = require("../../Action");

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
          (p) => p.role.alignment === "Town" && p.alive && p !== this.player
        );
        this.target = Random.randArrayVal(nonGhost);
        this.player.queueAlert(
          `If you get ${this.target.name} condemned you will learn a letter in the Word.`
        );
      },
      death: function (player) {
        if (player === this.target && this.player.alive) {
          var action = new Action({
            actor: this.player,
            target: this.target,
            game: this.game,
            labels: ["hidden"],
            run: function () {
              this.actor.queueAlert(
                `You learn that the Word contains the letter ${this.game.townWord.charAt(
                  Math.floor(Math.random() * this.game.townWord.length)
                )}.`
              );
            },
          });
          action.do();
        }
      },
    };
  }
};
