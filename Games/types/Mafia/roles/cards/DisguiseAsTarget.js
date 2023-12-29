const Card = require("../../Card");
const { PRIORITY_ITEM_GIVER_DEFAULT } = require("../../const/Priority");
const { addArticle } = require("../../../../core/Utils");

module.exports = class DisguiseAsTarget extends Card {
  constructor(role) {
    super(role);

    this.actions = [
      {
        priority: PRIORITY_ITEM_GIVER_DEFAULT,
        labels: ["giveItem", "suit", "hidden", "absolute"],
        run: function () {
          if (this.game.getStateName() != "Night") return;

          if (!this.actor.alive) return;

          let targets = this.getVisits(this.actor);
          for (let target of targets) {
            let role = target.getAppearance("investigate", true);
            this.actor.queueAlert(`:mask: After studying ${target.name}, you learn to act like ${addArticle(role)}.`);
            this.actor.holdItem("Suit", {type: role});
          }
        },
      },
    ];
  }
};
