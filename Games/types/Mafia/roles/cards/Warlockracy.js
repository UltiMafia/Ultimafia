const Card = require("../../Card");
const { PRIORITY_SUPPORT_VISIT_DEFAULT } = require("../../const/Priority");

module.exports = class Warlockracy extends Card {
  constructor(role) {
    super(role);

    this.meetings = {
      "Predict Vote": {
        states: ["Night"],
        flags: ["voting"],
        action: {
          role: this.role,
          priority: PRIORITY_SUPPORT_VISIT_DEFAULT,
          run: function () {
            this.role.predictedVote = this.target;
          },
        },
      },
    };

    this.listeners = {
      state: function (stateInfo) {
        if (!this.player.alive) {
          return;
        }

        if (!stateInfo.name.match(/Night/)) {
          return;
        }

        delete this.predictedVote;
      },
    };
  }
};
