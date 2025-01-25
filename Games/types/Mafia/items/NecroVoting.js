const Item = require("../Item");
const Action = require("../Action");
const { PRIORITY_EFFECT_GIVER_DEFAULT } = require("../const/Priority");
const { PRIORITY_INVESTIGATIVE_AFTER_RESOLVE_DEFAULT } = require("../const/Priority");
const { MEETING_PRIORITY_HOT_SPRINGS } = require("../const/MeetingPriority");

module.exports = class NecroVoting extends Item {
  constructor(meetingName) {
    super("WackyFactionRoleReveal");

    //this.reveal = reveal;
    this.lifespan = 1;
    this.cannotBeStolen = true;
    this.cannotBeSnooped = true;
    this.meetingName = meetingName;
    this.meetings[this.meetingName] = {
      states: ["Day"],
      flags: ["group", "anonymous", "voting"],
      targets: { include: ["alive"] },
      action: {
        labels: ["hidden", "absolute", "group", "multiActor"],
        priority: PRIORITY_INVESTIGATIVE_AFTER_RESOLVE_DEFAULT,
        item: this,
        run: function () {
          //this.target.role.revealToPlayer(this.actor);
          this.game.events.emit("NecroDrop");
          this.target.holdItem("Necronomicon");
          this.item.drop();
        },
      },
    };
  }
};
