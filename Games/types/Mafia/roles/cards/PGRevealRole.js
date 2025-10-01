const Card = require("../../Card");
const Random = require("../../../../../lib/Random");
const { PRIORITY_REVEAL_DEFAULT } = require("../../const/Priority");

module.exports = class PGRevealRole extends Card {
  constructor(role) {
    super(role);

    this.meetings = {
      "Photograph Player": {
        actionName: "Photograph Player",
        states: ["Night"],
        flags: ["voting"],
        action: {
          priority: PRIORITY_REVEAL_DEFAULT,
          run: function () {
            if (this.dominates()) {
              const displayRoleName = this.target.role.getDisplayName
                ? this.target.role.getDisplayName()
                : this.target.role.name;
              //const flavorText = `The Photographer has taken a picture of ${this.target.name}.`;
              //this.game.queueAlert(flavorText);
              let info = this.game.createInformation(
                "RevealInfo",
                this.actor,
                this.game,
                this.target,
                null,
                "All"
              );
              info.processInfo();
              info.getInfoRaw();
            }
          },
        },
      },
    };
  }
};
