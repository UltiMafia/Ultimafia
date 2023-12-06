const Card = require("../../Card");
const { PRIORITY_ITEM_GIVER_DEFAULT } = require("../../const/Priority");

module.exports = class GiveSnowballs extends Card {
  constructor(role) {
    super(role);

    this.meetings = {
      "Call a Snowball Fight?": {
        states: ["Night"],
        flags: ["voting"],
        inputType: "boolean",
        action: {
          priority: PRIORITY_ITEM_GIVER_DEFAULT,
          run: function () {
            if (this.target == "Yes") {
              this.game.queueAlert(":snowman: Someone calls a snowball fight!");
              for (const player of this.game.players) {
                player.holdItem("Snowball");
              }
            }
          },
        },
      },
    };
  }
};
