const Card = require("../../Card");

module.exports = class SpyCore extends Card {
  constructor(role) {
    super(role);

    this.appearance.merlin = "Spy";
    if (role.name == "Mordred") {
      this.appearance.merlin = null;
    }

    this.meetingMods = {
      "Mission Success": {
        flags: ["voting", "mustAct", "includeNo"],
      },
      "Identify Merlin": {
        canVote: true,
      },
      "Identify First Lover": {
        canVote: true,
      },
      "Identify Second Lover": {
        canVote: true,
      },
    };

    this.listeners = {
      start: function () {
        if (this.oblivious["Spies"]) return;

        for (let player of this.game.players) {
          if (
            player.role.alignment === "Spies" &&
            player !== this.player &&
            !player.role.oblivious["self"]
          ) {
            this.revealToPlayer(player);
          }
        }
      },
    };
  }
};
