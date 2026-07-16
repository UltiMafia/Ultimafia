const Card = require("../../Card");
const Random = require("../../../../../lib/Random");
const { PRIORITY_REVEAL_DEFAULT } = require("../../const/Priority");

module.exports = class MakePlayerLearnOneOfTwoPlayersOnDeath extends Card {
  constructor(role) {
    super(role);

    this.listeners = {
      death: function (player, killer, deathType) {
        if (player == this.player) {
          if (this.game.getStateName() != "Night") return;

          let info = this.game.createInformation(
            "TwoPlayersOneEvilInfo",
            this.player,
            this.game
          );
          info.processInfo();
          var alert = info.getInfoRaw();

          if (alert == "No Evil Players Exist") {
            this.player.queueAlert(`:invest: You learn that ${alert}`);
            return;
          }

          this.player.queueAlert(
            `:invest: You learn that at least one of ${alert[0].name} and ${alert[1].name} is Evil.`
          );
        }
      },
    };
    this.copyableListeners = {
      death: this,
    };
  }
};
