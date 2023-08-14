const Card = require("../../Card");
const { PRIORITY_CULT_CONVERT } = require("../../const/Priority");

module.exports = class ConvertToCultists extends Card {
  constructor(role) {
    super(role);

    this.meetingMods = {
      Cult: {
        actionName: "Convert",
        states: ["Night"],
        flags: ["group", "voting", "multiActor"],
        targets: { include: ["alive"], exclude: ["Cult"] },
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
