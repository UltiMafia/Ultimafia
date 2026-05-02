const Card = require("../../Card");
const { IMPORTANT_MEETINGS, ROLE_MEETINGS } = require("../../const/ImportantMeetings");

module.exports = class ClaimMatch extends Card {
  constructor(role) {
    super(role);
    this.meetings = {
      "Claim Match": {
        actionName: "Claim Match",
        states: ["Round"],
        flags: ["voting", "instant", "noVeg", "repeatable"],
        inputType: "text",
        targets: [],
        action: {
          item: this,
          run: function () {
            this.game.claimMatch(this.actor, this.target);
          },
        },
      },
    };
  }
};
