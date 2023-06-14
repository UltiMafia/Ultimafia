const Card = require("../../Card");
const {
  PRIORITY_NIGHT_SAVER,
  PRIORITY_KILL_DEFAULT,
} = require("../../const/Priority");

module.exports = class HideBehindPlayer extends Card {
  constructor(role) {
    super(role);

    this.meetings = {
      "Hide Behind": {
        states: ["Night"],
        flags: ["voting"],
        action: {
          labels: ["save"],
          priority: PRIORITY_NIGHT_SAVER,
          run() {
            this.actor.role.hideBehind = this.target;
            this.actor.tempImmunity.kill = Infinity;
          },
        },
      },
    };

    this.listeners = {
      state(stateInfo) {
        if (!this.player.alive) {
          return;
        }

        if (!stateInfo.name.match(/Day/)) {
          return;
        }

        delete this.hideBehind;
      },
    };

    this.actions = [
      {
        priority: PRIORITY_KILL_DEFAULT,
        labels: ["kill", "hiddem", "absolute"],
        run() {
          if (this.game.getStateName() != "Night") return;

          if (!this.actor.alive) return;

          const visitors = this.getVisitors();
          for (const v of visitors) {
            if (v == this.actor.role.hideBehind) {
              // skip the dominates check, this kill is absolute
              this.actor.kill("eaten", v);
            }
          }
        },
      },
    ];
  }
};
