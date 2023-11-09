const Item = require("../Item");
const Action = require("../Action");
const { PRIORITY_INVESTIGATIVE_DEFAULT } = require("../const/Priority");

module.exports = class Falcon extends Item {
  constructor() {
    super("Falcon");

    this.cursed = options?.cursed;
    this.meetings = {
      "Track with Falcon": {
        states: ["Night"],
        flags: ["voting"],
        action: {
          priority: PRIORITY_INVESTIGATIVE_DEFAULT,
          run: function () {
            if (this.cursed) {
              return;
            }
            let visits = this.getVisits(this.target);
            let visitNames = visits.map((p) => p.name);

            if (visitNames.length == 0) visitNames.push("no one");

            this.actor.queueAlert(
              `:track: Your falcon returns and tells you that ${this.target.name} visited ${visitNames.join(
                ", "
              )} during the night.`
            );
            this.item.drop();
          },
        },
      },
    };
    this.listeners = {
      run: function () {
        if (this.cursed) {
          return;
        }
        this.item.drop();
      },
    };
  }
};
