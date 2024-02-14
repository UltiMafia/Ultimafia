const Card = require("../../Card");

module.exports = class ClownAround extends Card {
  constructor(role) {
    super(role);

    this.meetings = {
      Visit: {
        meetingName: "Clown Around",
        states: ["Night"],
        flags: ["voting", "noVeg"],
        targets: { include: ["alive"], exclude: ["self"] },
        action: {
          run: function () {},
        },
      },
    };
    this.listeners = {
      roleAssigned: [
        function (player) {
          if (player !== this.player) {
            return;
          }

          this.game.queueAlert(
            `A friend of the Mafia has arrived to put on a great comedy for the dimwitted villagers. Time for one last joke.`,
            0,
            this.game.players.filter(
              (p) =>
                p.role.alignment === "Mafia" &&
                p != this.player
            )
          );
        },
      ],
      death: function (player, killer, deathType) {
        if (player == this.player && deathType == "condemn")
          this.data.clownCondemned = true;
      },
    };
  }
};
