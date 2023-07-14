const Card = require("../../Card");
const { PRIORITY_ITEM_TAKER_DEFAULT } = require("../../const/Priority");

module.exports = class StealAllItemsAndClovers extends Card {
  constructor(role) {
    super(role);

    this.meetings = {
      "Steal From": {
        states: ["Night"],
        flags: ["voting"],
        targets: { include: ["alive", "dead"], exclude: ["self"] },
        action: {
          labels: ["stealItem", "kill"],
          priority: PRIORITY_ITEM_TAKER_DEFAULT,
          run: function () {
            if (!this.target.hasItem("Clover")) {
              this.stealRandomItem();
              let killActor = false;
              switch (this.target.role.name) {
                case "Leprechaun":
                  if (this.dominates()) {
                      this.actor.queueAlert("You discover that ${this.target.name} is kin and murder them for their wares!");
                      this.target.kill("basic", this.actor);
                      this.stealItem = true;
                      break;
                default:
                  stealItem = true;
                  break;
            }

            this.stealItemByName(
              "Clover",
              null,
              null,
              "You stole a four-leaf clover!"
            );
            this.target.queueAlert("Your four-leaf clover has been stolen!");
          },
        },
      },
    };

    this.listeners = {
      state: function () {
        if (!this.player.alive) return;

        if (this.game.getStateName() != "Day") return;

        this.player.sendAlert(
          `You have ${this.player.getItems("Clover").length} four-leaf clovers!`
        );
      },
    };
  }
};
