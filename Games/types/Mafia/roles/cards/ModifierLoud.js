const Card = require("../../Card");
const Action = require("../../Action");
const Random = require("../../../../../lib/Random");
const {
  PRIORITY_INVESTIGATIVE_AFTER_RESOLVE_DEFAULT,
} = require("../../const/Priority");
const { addArticle } = require("../../../../core/Utils");

module.exports = class ModifierLoud extends Card {
  constructor(role) {
    super(role);

    this.passiveActions = [
      {
        ability: ["Information"],
        actor: role.player,
        state: "Night",
        game: role.game,
        role: role,
        priority: PRIORITY_INVESTIGATIVE_AFTER_RESOLVE_DEFAULT + 3,
        labels: ["investigate", "alerts", "hidden", "uncontrollable"],
        run: function () {
          let info = this.game.createInformation(
            "WatcherInfo",
            this.actor,
            this.game,
            this.actor
          );
          info.processInfo();
          let visitors = info.getInfoRaw();

          if (visitors?.length) {
            let names = visitors?.map((visitor) => visitor.name);

            this.game.queueAlert(
              `:loud: Someone shouts during the night: ` +
                `Curses! ${names.join(", ")} disturbed my slumber!`
            );
            this.actor.role.data.visitors = [];
          }
        },
      },
    ];
  }
};
