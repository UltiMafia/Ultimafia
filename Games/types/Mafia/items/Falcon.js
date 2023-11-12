const Item = require("../Item");
const { PRIORITY_INVESTIGATIVE_DEFAULT } = require("../const/Priority");

module.exports = class Falcon extends Item {
  constructor(options) {
    super("Falcon");

    this.meetings = {
      "Track with Falcon": {
        states: ["Night"],
        flags: ["voting"],
        action: {
          labels: ["hidden", "absolute"],
          priority: PRIORITY_INVESTIGATIVE_DEFAULT,
          item: this,
          run: function () {
            let visits = this.getVisits(this.target);
            let visitNames = visits.map((p) => p.name);

            if (visitNames.length == 0) visitNames.push("no one");

            this.actor.queueAlert(
              `:track: Your falcon returns and tells you that ${
                this.target.name
              } visited ${visitNames.join(", ")} during the night.`
            );
            this.item.drop();
          },
        },
      },
    };
  }
};
