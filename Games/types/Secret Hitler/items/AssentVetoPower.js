const Item = require("../Item");

module.exports = class AssentVetoPower extends Item {
  constructor() {
    super("Assent Veto Power");

    this.lifespan = 1;
    this.meetings = {
      "Assent Veto": {
        states: ["Legislative Session"],
        flags: ["voting"],
        inputType: "boolean",
        action: {
          run: function () {
            if (this.target == "Yes") {
              this.game.vetoAllPolicies();
            }
          },
        },
      },
    };
  }
};
