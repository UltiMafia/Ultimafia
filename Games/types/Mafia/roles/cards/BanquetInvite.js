const Card = require("../../Card");
const { PRIORITY_DAY_DEFAULT } = require("../../const/Priority");
const Random = require("../../../../../lib/Random");

module.exports = class BanquetInvite extends Card {
  constructor(role) {
    super(role);

    this.meetings = {
      "Invite Guests (2)": {
        states: ["Day"],
        flags: ["voting", "multi"],
        multiMin: 2,
        multiMax: 2,
        targets: { include: ["alive"], exclude: ["self"] },
        action: {
          role: this.role,
          labels: ["giveItem", "Invitation"],
          priority: PRIORITY_DAY_DEFAULT,
          run: function () {
            if (!this.role.hasAbility(["Meeting"])) {
              return;
            }
            this.target = Random.randomizeArray(this.target);
            this.target[0].holdItem("Invitation");
            this.target[1].holdItem("Invitation");
          },
        },
      },
    };
  }
};
