const Card = require("../../Card");

module.exports = class EndGameAtAnyTime extends Card {
  constructor(role) {
    super(role);

    this.meetings = {
      "Stop Hosting?": {
        states: ["Day", "Night"],
        flags: ["voting", "instant", "noVeg"],
        inputType: "boolean",
        action: {
          run: function () {
            if (this.target == "Yes") {
              this.actor.kill("Basic");
              //this.game.immediateEnd();
            }
          },
        },
      },
    };
  }
};
