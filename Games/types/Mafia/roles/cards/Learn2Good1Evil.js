const Card = require("../../Card");
const Action = require("../../Action");
const Random = require("../../../../../lib/Random");
const { PRIORITY_INVESTIGATIVE_DEFAULT } = require("../../const/Priority");

module.exports = class Learn2Good1Evil extends Card {
  constructor(role) {
    super(role);

    this.passiveActions = [
      {
        ability: ["Information"],
        actor: role.player,
        state: "Night",
        game: role.game,
        role: role,
        priority: PRIORITY_INVESTIGATIVE_DEFAULT,
        labels: ["investigate"],
        run: function () {
            if (this.role.hasMaestroInfo) return;
            this.role.hasMaestroInfo = true;

            let info = this.game.createInformation(
              "TwoGoodOneEvilInfo",
              this.actor,
              this.game,
              this.actor
            );
            info.processInfo();
            var alert = `:carol: ${info.getInfoFormated()}.`;
            this.actor.queueAlert(alert);
          },
      },
    ];
  }
};
