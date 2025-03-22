const Card = require("../../Card");

module.exports = class Duel extends Card {
  constructor(role) {
    super(role);
    /*
    const { actor, target } = this;

    actor.winner = "";

    // Setting hp
    actor.hp = 150;
    target.hp = 150;

    // Setting defense
    actor.def = 10;
    target.def = 10;

    actor.atk = 15;
    target.atk = 15;

    // Setting crit
    actor.crit = 1.0;
    target.crit = 1.0;
*/
    this.listeners = {
      state: function (stateInfo) {
        if (!this.player.alive) {
          return;
        }

        if (!stateInfo.name.match(/Day/)) {
          return;
        }

        this.game.queueAlert(
          "A samurai has come to town to prove their worth! Losing against them could bring disastrous consequences…"
        );
      },
    };

    this.meetings = {
      Duel: {
        states: ["Night"],
        flags: ["voting"],
        action: {
          labels: ["duel"],
          run: function () {
            this.actor.def = 10;
            this.actor.atk = 15;
            this.actor.crit = 1.0;
            this.target.def = 10;
            this.target.atk = 15;
            this.target.crit = 1.0;
            this.target.holdItem("Blade");
            this.actor.holdItem("Blade");
          },
          shouldMeet: function () {
            //If a battle happened, samurai can't pick again
            return this.actor.hp == 150 && this.target.hp == 150;
          },
        },
      },
    };
  }
};
