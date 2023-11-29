const Card = require("../../Card");
const { PRIORITY_ITEM_GIVER_DEFAULT } = require("../../const/Priority");

module.exports = class GiveSnowballs extends Card {
  constructor(role) {
    super(role);

    this.meetings = {
      "Call a Snowball Fight?": {
        states: ["Day"],
        flags: ["voting", "instant"],
        inputType: "boolean",
        action: {
          priority: PRIORITY_ITEM_GIVER_DEFAULT,        
          run: function () {
            if (this.target == "Yes") {
              for (let player of this.game.players) {
                this.game.queueAlert(":snowman: Someone calls a snowball fight!");
                player.holdItem("Snowball");
              }
            }
          },
        },
      },
    };
  }
};
