const Card = require("../../Card");
const Action = require("../../Action");
const Random = require("../../../../../lib/Random");
const { PRIORITY_INVESTIGATIVE_DEFAULT } = require("../../const/Priority");

module.exports = class LearnOneOfTwoPlayers extends Card {
  constructor(role) {
    super(role);

    
    this.listeners = {
      state: function (stateInfo) {
        if (!this.player.alive) {
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
            if (!this.actor.alive) return;
            if (this.actor.role.hasInfo) return;

            
            var alive = this.game.players.filter(
              (p) => p.alive && p != this.actor
            );
            if (alive.length <= 3) {
              this.actor.queueAlert(
                ` You learn nothing because only 2 players are alive.`
              );
              return;
            }
            this.actor.role.hasInfo = true;
            
            let info = this.game.createInformation(
              "OneOfPlayersIsRoleInfo",
              this.actor,
              this.game
            );
            info.processInfo();
            var alert = `:invest: ${info.getInfoFormated()}.`;
            this.actor.queueAlert(alert);
          },
        });

        this.game.queueAction(action);
      },
    };
  }
};
