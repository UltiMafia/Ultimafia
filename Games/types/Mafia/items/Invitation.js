const Item = require("../Item");
const { MEETING_PRIORITY_BANQUET } = require("../const/MeetingPriority");
const Random = require("../../../../lib/Random");

module.exports = class Invitation extends Item {
  constructor() {
    super("Invitation");

    this.lifespan = 1;
    this.cannotBeStolen = true;

    this.meetings = {
      Banquet: {
        actionName: "End Meeting?",
        states: ["Night"],
        flags: [
          "exclusive",
          "group",
          "speech",
          "anonymous",
          "voting",
          "mustAct",
          "noVeg",
        ],
        inputType: "boolean",
        priority: MEETING_PRIORITY_BANQUET,
      },
    };

    this.listeners = {
      meeting: function (meeting) {
        if (meeting.name === "Banquet") {
          let players = meeting.members.map((a) => a.player);
          let roles = Random.randomizeArray(players.map((a) => a.role.name));
          if (players.includes(this.holder)) {
            this.game.sendAlert(
              `You look around the dinner table and see: ${roles.join(", ")}`,
              [this.holder]
            );
          }
        }
      },
    };
  }
};
