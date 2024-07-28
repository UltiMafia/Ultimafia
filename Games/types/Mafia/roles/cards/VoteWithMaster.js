const Card = require("../../Card");
const { PRIORITY_SUPPORT_VISIT_DEFAULT } = require("../../const/Priority");

module.exports = class VoteWithMaster extends Card {
  constructor(role) {
    super(role);
    this.role.data.master = 0;
    this.meetings = {
      Butler: {
        actionName: "Become Servent",
        states: ["Night"],
        flags: ["voting"],
        action: {
          labels: ["visit"],
          priority: PRIORITY_SUPPORT_VISIT_DEFAULT,
          run: function () {
            this.actor.role.data.master = this.target;
            //this.actor.role.data.MasterVote = 0;
            //this.actor.role.data.ButlerVote = 0;
          },
        },
      },
    };

    this.listeners = {
      meeting: function (meeting) {
        if (meeting.name != "Village" || this.player.role.data.master == 0)
          return;
        if (meeting.members[this.player.role.data.master.id]) {
          meeting.members[this.player.role.data.master.id].voteWeight = 2;
        }
        if (meeting.members[this.player.id]) {
          meeting.members[this.player.id].voteWeight = 0;
        }
      },
    };
  }
};
