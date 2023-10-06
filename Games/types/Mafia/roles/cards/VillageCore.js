const Card = require("../../Card");
const { PRIORITY_VILLAGE } = require("../../const/Priority");

module.exports = class VillageCore extends Card {
  constructor(role) {
    super(role);

    this.meetings = {
      Village: {
        type: "Village",
        states: ["Day"],
        targets: { include: ["alive"], exclude: [cannotBeVoted] },
        flags: ["group", "speech", "voting", "noVeg"],
        whileDead: true,
        passiveDead: true,
        speakDead: true,
        action: {
          labels: ["kill", "condemn", "hidden"],
          priority: PRIORITY_VILLAGE,
          power: 3,
          run: function () {
            if (this.dominates()) this.target.kill("condemn", this.actor);
          },
        },
      },
      Graveyard: {
        states: ["Night"],
        flags: ["group", "speech", "liveJoin"],
        whileAlive: false,
        whileDead: true,
        passiveDead: false,
        speakDead: true,
      },
    };
  }
};

function cannotBeVoted(player) {
  return player.hasEffect("CannotBeVoted");
}
