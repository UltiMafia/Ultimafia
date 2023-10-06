const Card = require("../../Card");
const { PRIORITY_CONVERT_DEFAULT } = require("../../const/Priority");

module.exports = class ConvertToCultists extends Card {
  constructor(role) {
    super(role);

    this.meetings = {
      Cultists: {
        actionName: "Convert",
        states: ["Night"],
        flags: ["group", "voting", "multiActor"],
        targets: { include: ["alive"], exclude: ["Cult"] },
        action: {
          labels: ["convert", "cult"],
          priority: PRIORITY_CONVERT_DEFAULT,
          run: function () {
            if (this.dominates()) {
                 this.target.setRole("Vampire");
                this.actor.giveEffect("Bleeding", this.actor);
            }
          },
        },
      },
    };
  }
};
