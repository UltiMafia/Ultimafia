const Item = require("../Item");
const Action = require("../Action");
const { PRIORITY_EFFECT_GIVER_DEFAULT } = require("../const/Priority");
const { PRIORITY_REVEAL_DEFAULT } = require("../const/Priority");
const { MEETING_PRIORITY_HOT_SPRINGS } = require("../const/MeetingPriority");

module.exports = class WackyFactionRoleReveal extends Item {
  constructor(reveal) {
    super("WackyFactionRoleReveal");

    this.reveal = reveal;
    this.meetingName = `Reveal to ${this.holder.faction}`;
    this.meetings[this.meetingName] = {
      states: ["Night"],
        flags: ["group", "anonymous", "voting"],
        action: {
          labels: ["hidden", "absolute","reveal"],
          priority: PRIORITY_REVEAL_DEFAULT,
          item: this,
          run: function () {
            this.target.role.revealToPlayer(this.item.holder);
            this.item.drop();
          },
        },
    };
  }
};
