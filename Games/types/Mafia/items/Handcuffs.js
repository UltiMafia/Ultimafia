const Item = require("../Item");
const Action = require("../Action");
const { MEETING_PRIORITY_JAIL } = require("../const/MeetingPriority");
const { PRIORITY_UNTARGETABLE } = require("../const/Priority");

module.exports = class Handcuffs extends Item {
  constructor(meetingName, jailor) {
    super("Handcuffs");

    this.meetingName = meetingName;
    this.jailor = jailor;
    this.lifespan = 1;
    this.cannotBeStolen = true;
    this.meetings[meetingName] = {
      meetingName: "Jail",
      actionName: "Execute Prisoner",
      states: ["Night"],
      flags: ["exclusive", "group", "speech", "voting", "anonymous"],
      inputType: "boolean",
      canVote: false,
      priority: MEETING_PRIORITY_JAIL,
      shouldMeet: function (meetingName) {
        let handcuff = this.player.getItemProp(
          "Handcuffs",
          "meetingName",
          meetingName
        );
        if (handcuff?.jailor.alive && !handcuff?.jailor.hasItem("Handcuffs")) {
          return true;
      }
      return false;
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
          run: function () {
            this.makeUntargetable(this.target, "jail");
            this.blockActions();
          },
        });

        this.game.queueAction(this.action);
      },
    };
  }
};
