const Item = require("../Item");
const Action = require("../Action");
const { PRIORITY_UNTARGETABLE } = require("../const/Priority");
const { MEETING_PRIORITY_LOCK } = require("../const/MeetingPriority");

module.exports = class Lock extends Item {
  constructor(options, lifespan) {
    super("Lock");
    this.cannotBeStolen = true;
    this.cannotBeSnooped = true;
    this.lifespan = lifespan || 1;
    this.magicCult = options?.magicCult;
    this.broken = options?.broken;

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
          priority: PRIORITY_UNTARGETABLE - 5,
          item: this,
          run: function () {
            if (this.item.magicCult) {
              this.makeUntargetable(this.target, "placeholder", "Cult");
            } else if (!this.item.broken) {
              this.makeUntargetable();
            }

            this.blockActions();
          },
        });

        this.game.queueAction(this.action);
      },
    };
  }
};
