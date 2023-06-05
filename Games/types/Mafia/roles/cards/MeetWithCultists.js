const Card = require("../../Card");
const { PRIORITY_CULT_CONVERT } = require("../../const/Priority");

module.exports = class MeetWithCultists extends Card {
  constructor(role) {
    super(role);

    this.meetings = {
      Cultists: {
        actionName: "Convert",
        states: ["Night"],
        flags: ["group", "voting", "multiActor"],
        targets: { include: ["alive"], exclude: ["Monsters"] },
        action: {
          labels: ["convert", "cultist"],
          priority: PRIORITY_CULT_CONVERT,
          run: function () {
            if (this.dominates()) this.target.setRole("Cultist");
          },
        },
      },
    };
  }
};
