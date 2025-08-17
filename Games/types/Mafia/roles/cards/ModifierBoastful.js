const Card = require("../../Card");
const Action = require("../../Action");
const Random = require("../../../../../lib/Random");
const {
  PRIORITY_INVESTIGATIVE_AFTER_RESOLVE_DEFAULT,
} = require("../../const/Priority");
const { addArticle } = require("../../../../core/Utils");

module.exports = class ModifierBoastful extends Card {
  constructor(role) {
    super(role);

    this.listeners = {
      state: function (stateInfo) {
        if (!this.hasAbility(["Information"])) {
          return;
        }

        if (!stateInfo.name.match(/Night/)) {
          return;
        }

        var action = new Action({
          actor: this.player,
          game: this.player.game,
          priority: PRIORITY_INVESTIGATIVE_AFTER_RESOLVE_DEFAULT + 3,
          labels: [
            "investigate",
            "alerts",
            "hidden",
            "absolute",
            "uncontrollable",
          ],
          role: this.role,
          run: function () {
            let info2 = this.game.createInformation(
              "ReportsInfo",
              this.actor,
              this.game,
              this.actor
            );
            info2.processInfo();
            let reports = info2.getInfoRaw();

            for (let report of reports) {
              this.game.queueAlert(
                `:loud: ${addArticle(
                  this.actor.getRoleAppearance()
                )} is overheard reading: ${report}`
              );
            }
          },
        });

        this.game.queueAction(action);
      },
    };
  }
};
