const Card = require("../../Card");
const { PRIORITY_KILL_DEFAULT } = require("../../const/Priority");

module.exports = class MassMurderer extends Card {
  constructor(role) {
    super(role);

    this.meetings = {
      Kill: {
        actionName: "Rampage",
        states: ["Night"],
        flags: ["voting"],
        action: {
          labels: ["kill"],
          priority: PRIORITY_KILL_DEFAULT + 1,
          run: function () {
            let visitors = this.getVisitors(this.actor);
            for (let v of visitors) {
              if (this.dominates(v)) {
                v.kill("basic", this.actor);
              }
            }
            const visits = this.getVisits(this.target);
            if (visits.length > 0) return;
            else this.target.kill("basic", this.actor);
          },
        },
      },
    };
  }
};
