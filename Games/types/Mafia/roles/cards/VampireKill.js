const Card = require("../../Card");
const { PRIORITY_KILL_DEFAULT } = require("../../const/Priority");

module.exports = class VampireKill extends Card {
  constructor(role) {
    super(role);

    this.meetings = {
      Vampire: {
        actionName: "Vampire Kill",
        states: ["Night"],
        flags: ["group", "voting", "multiActor"],
        targets: {
          include: ["alive", "members"],
        },
        shouldMeet: function (meetingName) {
          let vampires = this.game.players.filter(
            (p) => p.role.name == "Vampire"
          );
          return vampires.length > 1;
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
      "Vampire Solo": {
        actionName: "Vampire Kill",
        states: ["Night"],
        flags: ["voting"],
        targets: {
          include: ["alive"],
          exclude: ["self"],
        },
        shouldMeet: function (meetingName) {
          let vampires = this.game.players.filter(
            (p) => p.role.name == "Vampire"
          );
          return vampires.length <= 1;
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
