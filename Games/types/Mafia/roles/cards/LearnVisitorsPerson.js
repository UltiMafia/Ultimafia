const Card = require("../../Card");
const Action = require("../../Action");
const Random = require("../../../../../lib/Random");
const { PRIORITY_INVESTIGATIVE_DEFAULT } = require("../../const/Priority");

module.exports = class LearnVisitorsPerson extends Card {
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
        labels: ["investigate", "role", "hidden"],
        run: function () {
            let info = this.game.createInformation(
              "WatcherInfo",
              this.actor,
              this.game,
              this.actor,
              false,
              true
            );
            info.processInfo();

            this.actor.queueAlert(`:watch: ${info.getInfoFormated()}`);
          },
      },
    ];
  }
};
