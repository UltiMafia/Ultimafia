const Card = require("../../Card");
const Random = require("../../../../../lib/Random");
const {
  PRIORITY_NIGHT_SAVER,
  PRIORITY_KILL_DEFAULT,
} = require("../../const/Priority");

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
          run: function () {
            this.preventConvert();
            this.heal();

            this.actor.role.data.surgeonSave = this.target;
          },
        },
      },
    };
    this.actions = [
      {
        labels: ["kill", "hidden"],
        priority: PRIORITY_KILL_DEFAULT,
        run: function () {
          if (!this.actor.role.data.surgeonSave) {
            return;
          }
          const attackers = this.getVisitors(
            this.actor.role.data.surgeonSave,
            "kill"
          );
          if (attackers.length <= 0) {
            return;
          }
          const toKill = Random.randArrayVal(attackers);
          if (this.dominates(toKill)) {
            toKill.kill("basic", this.actor);
          }
          this.actor.role.data.surgeonSave = null;
        },
      },
    ];
  }
};
