const Card = require("../../Card");
const { PRIORITY_EFFECT_GIVER_DEFAULT } = require("../../const/Priority");
const Action = require("../../Action");

module.exports = class LibraryDay extends Card {
  constructor(role) {
    super(role);

    this.meetings = {
        "Meet at Library?": {
          states: ["Night"],
          flags: ["voting", "noVeg"],
          inputType: "boolean",
          shouldMeet: function () {
            return !this.data.LibraryDay;
          },
          action: {
            priority: PRIORITY_EFFECT_GIVER_DEFAULT,
            run: function () {
              if (this.target === "Yes") {
                this.actor.role.data.LibraryDay = true;
                this.game.queueAlert("The Town meets at a Library to decide the condemnation. Shhh...");
                for (const player of this.game.players) {
                    this.target.giveEffect("Quiet", 1);
                }
              }
            },
          },
        },
      };
  }
};
