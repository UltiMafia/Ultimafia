const Card = require("../../Card");
const { PRIORITY_KILL_DEFAULT } = require("../../const/Priority");

module.exports = class VampireKill extends Card {
  constructor(role) {
    super(role);

    this.meetings = {
      Vampire: {
        actionName: "Vampire Kill",
        states: ["Night"],
        flags: ["voting", "mustAct"],
        targets: {
          include: [isVampire],
          exclude: ["dead"],
        },
        shouldMeet: function (meetingName) {
          let vampires = this.game.players.filter(
            (p) => p.role.name == "Vampire" && p.alive
          );
          if (this.player == vampires[0]) {
            return true;
          }

          return false;
        },
        action: {
          labels: ["kill"],
          priority: PRIORITY_KILL_DEFAULT,
          run: function () {
            if (this.dominates()) {
              this.target.kill("basic", this.actor);
            }
          },
        },
      },
    };
  }
};

function isVampire(player) {
  let vampires = player.game.players.filter(
    (p) => p.role.name == "Vampire" && p.alive
  );
  if (vampires.length > 1) {
    return (
      this.role &&
      player.role.name == "Vampire" &&
      player.alive &&
      player.getFaction() == this.role.player.getFaction()
    );
  } else {
    return this.role && player.alive;
  }
}
