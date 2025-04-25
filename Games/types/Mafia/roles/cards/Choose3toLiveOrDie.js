const Card = require("../../Card");
const { PRIORITY_ITEM_GIVER_DEFAULT } = require("../../const/Priority");

module.exports = class Choose3toLiveOrDie extends Card {
  constructor(role) {
    super(role);

    this.meetings = {
      "Death Game": {
        states: ["Night"],
        flags: ["voting", "instant", "multi"],
        targets: { include: ["alive","dead","self"]},
        multiMin: 3,
        multiMax: 3,
        action: {
          labels: ["giveItem"],
          run: function () {
            if (!this.actor.hasAbility(["Kill"])) {
          return;
         }
            this.actor.data.PlayersChoosenDie = false;
            this.target[0].holdItem("LiveOrDie", this.actor, this.target);
          },
        },
      },
    };
  }
};
