const Item = require("../Item");
const { MEETING_DEAD_PARTY, PRIORITY_REVEAL_DEFAULT } = require("../const/MeetingPriority");

module.exports = class Costume extends Item {
  constructor(reveal) {
    super("Costume");

    this.reveal = reveal;
    this.lifespan = 1;
    this.cannotBeStolen = true;
    this.cannotBeSnooped = true;

    this.meetings = {
      "Masquerade!": {
        actionName: "Best Costume?",
        states: ["Night"],
        flags: ["group", "speech", "voting", "mustAct", "anonymous"],
        targets: { include: ["alive"], exclude: ["dead"] },
        passiveDead: true,
        whileDead: true,
        speakDead: true,
        priority: MEETING_DEAD_PARTY -1,
        action: {
            labels: ["hidden", "absolute", "reveal"],
            priority: PRIORITY_REVEAL_DEFAULT,
            run: function () {
              this.target.role.revealToAll();
            },
          },
      },
    };
  }
};
