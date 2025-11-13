const Item = require("../Item");
const Action = require("../Action");
const { PRIORITY_EFFECT_GIVER_DEFAULT } = require("../const/Priority");
const { PRIORITY_REVEAL_DEFAULT } = require("../const/Priority");
const { MEETING_PRIORITY_HOT_SPRINGS } = require("../const/MeetingPriority");

module.exports = class WackyFactionRoleReveal extends Item {
  constructor(meetingName) {
    super("WackyFactionRoleReveal");

    this.cannotBeSnooped = true;

    //this.reveal = reveal;
    this.lifespan = 1;
    this.meetingName = meetingName;
    this.meetings[this.meetingName] = {
      states: ["Night"],
      flags: ["group", "anonymous", "voting"],
      item: this,
      targets: { include: ["alive"] },
      action: {
        labels: ["hidden", "absolute", "reveal", "group", "multiActor"],
        priority: PRIORITY_REVEAL_DEFAULT,
        item: this,
        run: function () {
          //this.target.role.revealToPlayer(this.actor);
          for (let p of this.game.players) {
            if (this.actor.faction == p.faction) {
              this.target.role.revealToPlayer(p);
            }
          }
          this.item.drop();
        },
      },
    };
  }
};
