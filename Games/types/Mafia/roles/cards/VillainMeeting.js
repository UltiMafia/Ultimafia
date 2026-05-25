const Card = require("../../Card");

module.exports = class VillainMeeting extends Card {
  constructor(role) {
    super(role);

    this.meetings = {
      Villain: {
        states: ["Night"],
        flags: ["group", "speech", "anonymous"],
      },
    };

    this.actions = [
      {
        priority: 0,
        run: function () {
          if (!this.actor.alive) {
            return;
          }

          if (
            this.game.getStateName() != "Dusk" &&
            this.game.getStateName() != "Day"
          ) {
            return;
          }

          for (let player of this.game.players) {
            if (
              player.alive &&
              player.role.alignment === "Independent"
            ) {
              player.holdItem("JoinVillainMeeting");
            }
          }
        },
      },
    ];

    this.listeners = {
      roleAssigned: function (player) {
        if (player !== this.player) {
          return;
        }

        for (let p of this.game.players) {
          if (p.alive && p.role.alignment === "Independent") {
            p.holdItem("JoinVillainMeeting");
          }
        }
      },
    };
  }
};
