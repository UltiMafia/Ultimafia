const { addArticle } = require("../../../../core/Utils");
const Action = require("../../Action");
const Random = require("../../../../../lib/Random");
const Card = require("../../Card");
const { PRIORITY_INVESTIGATIVE_DEFAULT } = require("../../const/Priority");

module.exports = class LearnVisitorsRole extends Card {
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
            "WatcherRoleInfo",
            this.actor,
            this.game,
            this.actor
          );
          info.processInfo();
          let visitors = info.getInfoRaw();
          for (let visitor of visitors) {
            this.actor.queueAlert(
              `Last night, ${addArticle(
                visitor
              )} visited you and confessed their sins.`
            );
          }
        },
      },
    ];
  }
};
