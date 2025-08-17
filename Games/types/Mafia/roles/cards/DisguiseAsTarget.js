const Card = require("../../Card");
const Action = require("../../Action");
const {
  PRIORITY_MODIFY_INVESTIGATIVE_RESULT_DEFAULT,
} = require("../../const/Priority");
const { addArticle } = require("../../../../core/Utils");

module.exports = class DisguiseAsTarget extends Card {
  constructor(role) {
    super(role);

    this.listeners = {
      state: function (stateInfo) {
        if (!this.hasAbility(["Modifier"])) {
          return;
        }

        if (!stateInfo.name.match(/Night/)) {
          return;
        }

        var action = new Action({
          actor: this.player,
          game: this.player.game,
          priority: PRIORITY_MODIFY_INVESTIGATIVE_RESULT_DEFAULT,
          labels: ["giveItem", "suit", "hidden", "absolute"],
          run: function () {
            let targets = this.getVisits(this.actor);
            for (let target of targets) {
              let role = target.getAppearance("investigate", true);
              /*
              this.actor.queueAlert(
                `:mask: After studying ${
                  target.name
                }, you learn to act like ${addArticle(role)}.`
              );
              */
              this.actor.holdItem("Suit", { type: role });
            }
          },
        });

        this.game.queueAction(action);
      },
    };
  }
};
