const Item = require("../Item");
const Action = require("../Action");
const { PRIORITY_UNTARGETABLE } = require("../const/Priority");
const { MEETING_PRIORITY_LOCK } = require("../const/MeetingPriority");

module.exports = class Lock extends Item {
  constructor(lifespan) {
    super("Lock");
    this.cannotBeStolen = true;
    this.cannotBeSnooped = true;
    this.lifespan = lifespan || 1;

    this.meetings = {
      "Lock Yourself": {
        states: ["Night"],
        flags: ["exclusive"],
        priority: MEETING_PRIORITY_LOCK,
      },
    };
    this.listeners = {
      state: function (stateInfo) {
        if (!stateInfo.name.match(/Night/)) {
          return;
        }

        this.action = new Action({
          actor: this.holder,
          target: this.holder,
          game: this.game,
          priority: PRIORITY_UNTARGETABLE,
          labels: ["block", "absolute", "lock"],
          run: function () {
            this.makeUntargetable();
            this.blockActions();
          },
        });

        this.game.queueAction(this.action);
      },
    };
  }
};
