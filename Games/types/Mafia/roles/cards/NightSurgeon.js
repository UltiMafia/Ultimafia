const Card = require("../../Card");
const Random = require("../../../../../lib/Random");
const { PRIORITY_NIGHT_SAVER } = require("../../const/Priority");

module.exports = class NightSurgeon extends Card {
  constructor(role) {
    super(role);

    this.meetings = {
      Save: {
        states: ["Night"],
        flags: ["voting"],
        action: {
          labels: ["save", "kill"],
          priority: PRIORITY_NIGHT_SAVER,
          run() {
            this.preventConvert();
            this.heal();

            const attackers = this.getVisitors(this.target, "kill");
            // TODO: the more correct way is to put the kill action as a passive like masons
            const parsedAttackers = attackers.filter(
              (a) => a.role.name != "Surgeon"
            );

            const toKill = Random.randArrayVal(parsedAttackers);
            if (this.dominates(toKill)) {
              toKill.kill(this.actor);
            }
          },
        },
      },
    };
  }
};
