const Card = require("../../Card");
const Random = require("../../../../../lib/Random");

module.exports = class FinalThreeNoCondemnWin extends Card {
  constructor(role) {
    super(role);

    this.immunity["kill"] = Infinity;
    this.listeners = {
      immune: function (action) {
        if (this.player.hasEffect("Insanity")) return;

        if (action.target !== this.player) {
          return;
        }

        if (!action.hasLabel("kill")) {
          return;
        }

        let sacrifice;
        let alive;
        let sacrificed;
        if (this.game.getStateName() == "Day"){
          sacrifice = false;
        } else {
          sacrifice = Random.randArrayVal([true, false]);
          alive = this.game.players.filter((p) => p.alive && p != this.player);
          sacrificed = Random.randArrayVal(alive);
        }

        if (!sacrifice){
          delete this.immunity["kill"];
          this.player.kill("basic", this.player);
        } else {
          sacrificed.kill("basic", this.player);
        }
      },
      meetingFinish: function (meeting) {
        if (this.player.hasEffect("Insanity")) return;

        if (meeting.name !== "Village") {
          return;
        }

        let alivePlayers = this.game.players.filter((p) => p.alive);
        if ((alivePlayers.indexOf(meeting.finalTarget) == -1) && alivePlayers.length == 3){
          this.game.goodWin = true;
        }
      }
    };
  }
};
