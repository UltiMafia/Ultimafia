const Card = require("../../Card");
const { PRIORITY_INVESTIGATIVE_DEFAULT } = require("../../const/Priority");

module.exports = class SnoopItems extends Card {
  constructor(role) {
    super(role);

    this.meetings = {
      Snoop: {
        states: ["Night"],
        flags: ["voting"],
        action: {
          priority: PRIORITY_INVESTIGATIVE_DEFAULT,
          run() {
            const items = this.snoopAllItems();
            items.sort();

            let itemsToAlert = "nothing";
            if (items.length > 0) {
              itemsToAlert = items.join(", ");
            }

            const alert = `:sy7b: You snoop on ${this.target.name} during the night and find they are carrying ${itemsToAlert}.`;
            this.actor.queueAlert(alert);
          },
        },
      },
    };
  }
};
