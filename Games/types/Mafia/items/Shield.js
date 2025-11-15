const Item = require("../Item");
const Action = require("../Action");
const Random = require("../../../../lib/Random");
const { PRIORITY_MODIFY_ACTION } = require("../const/Priority");

module.exports = class Shield extends Item {
  constructor(options, lifespan) {
    super("Shield");

    this.lifespan = lifespan || Infinity;
    this.magicCult = options?.magicCult;
    this.broken = options?.broken;

    this.baseMeetingName = "Use Shield";
    this.currentMeetingIndex = 0;

    this.meetings = {
      [this.baseMeetingName]: {
        actionName: "Use Shield",
        states: ["Night"],
        flags: ["voting"],
        inputType: "boolean",
        item: this,
        action: {
          labels: ["hidden"],
          priority: PRIORITY_MODIFY_ACTION,
          item: this,
          run: function () {
            if (this.target != "Yes") return;
            this.item.drop();
            //this.game.broadcast("gunshot");
            if (this.item.magicCult == true || this.broken == true) {
              return;
            }
            for (let action of this.game.actions[0]) {
              if (
                action.hasLabels(["hidden", "Shield"]) &&
                action.item != this.item &&
                action.actor == this.actor
              ) {
                action.cancel(true);
              }
            }
            var alive = this.game.players.filter(
              (p) =>
                p.alive &&
                p != this.actor &&
                p.role.alignment == this.actor.role.alignment
            );
            if (alive.length > 0) {
              var randomTarget = Random.randArrayVal(alive);
              for (const action of this.game.actions[0]) {
                if (action.target === this.actor && action.hasLabel("kill")) {
                  action.target = randomTarget;
                }
              }
            }
          },
        },
      },
    };

    this.listeners = {
      state: function (stateInfo) {
        if (this.game.getStateName() != "Night") return;

        if (!this.holder.alive) return;
      },
    };
  }
};
