const Card = require("../../Card");
const Random = require("../../../../../lib/Random");
const Action = require("../../Action");
const { PRIORITY_INVESTIGATIVE_DEFAULT } = require("../../const/Priority");

module.exports = class CountVisitors extends Card {
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
        labels: ["hidden"],
        run: function () {
            if (this.hasVisitors()) {
              let info = this.game.createInformation(
                "CountVisitorsInfo",
                this.actor,
                this.game,
                this.actor
              );
              info.processInfo();

              this.actor.queueAlert(
                `:visited: You were visited by ${info.getInfoRaw()} people last night.`
              );
            }
          },
      },
    ];

  }
};
