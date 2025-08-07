const Card = require("../../Card");
const Action = require("../../Action");
const Random = require("../../../../../lib/Random");
const { PRIORITY_INVESTIGATIVE_DEFAULT } = require("../../const/Priority");

module.exports = class Omiscient extends Card {
  constructor(role) {
    super(role);

    this.listeners = {
      state: function (stateInfo) {
        if (!this.hasAbility(["Modifier", "Information"])) {
          return;
        }

        if (!stateInfo.name.match(/Night/)) {
          return;
        }

        var action = new Action({
          actor: this.player,
          game: this.player.game,
          priority: PRIORITY_INVESTIGATIVE_DEFAULT,
          labels: ["investigate"],
          run: function () {
            let visits;
            let visitNames;
            let role;
            let name;
            let players = this.game.alivePlayers();
            for (let x = 0; x < players.length; x++) {
              let info = this.game.createInformation(
                "RevealInfo",
                this.actor,
                this.game,
                players[x],
                null,
                "Self"
              );
              info.processInfo();
              info.getInfoRaw();

              let info2 = this.game.createInformation(
                "TrackerInfo",
                this.actor,
                this.game,
                players[x]
              );
              info2.processInfo();
              this.actor.queueAlert(`:track: ${info2.getInfoFormated()}`);
            }
          },
        });

        this.game.queueAction(action);
      },
    };
  }
};
