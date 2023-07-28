const Card = require("../../Card");
const { PRIORITY_NIGHT_REVIVER } = require("../../const/Priority");

module.exports = class ReviveIfTown extends Card {
  constructor(role) {
    super(role);

    this.meetings = {
      Revive: {
        actionName: "Revive",
        states: ["Night"],
        flags: ["voting"],
        targets: { include: ["dead"], exclude: ["alive", "self"] },
        shouldMeet: function () {
          return !this.data.revived;
        },
        action: {
          labels: ["revive"],
          priority: PRIORITY_NIGHT_REVIVER,
          run: function () {
            if (this.dominates()) this.actor.role.data.revived = true;

            if (this.isInsane()) return;

            let targetIsVillager = this.game.villagers.filter((r) => r == this.target.role.name).length
            if (targetIsVillager >= 1) this.target.revive("basic", this.actor); // for some reason this.target.role.name works but not this.target.role.alignment??
          },
        },
      },
    };
  }
};
