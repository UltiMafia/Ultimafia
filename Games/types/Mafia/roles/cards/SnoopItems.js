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
          run: function () {
            //items.sort();
            let info = this.game.createInformation(
              "ItemInfo",
              this.actor,
              this.game,
              this.target
            );
            info.processInfo();

            this.actor.queueAlert(`:snoop: ${info.getInfoFormated()}`);

            //let alert = `:snoop: You snoop on ${this.target.name} during the night and find they are carrying ${itemsToAlert}.`;
            //this.actor.queueAlert(alert);
          },
        },
      },
    };
  }
};
