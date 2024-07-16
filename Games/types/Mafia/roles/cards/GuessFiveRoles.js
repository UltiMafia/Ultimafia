const Card = require("../../Card");
const { PRIORITY_INVESTIGATIVE_DEFAULT } = require("../../const/Priority");

module.exports = class GuessFiveRoles extends Card {
  constructor(role) {
    super(role);

    this.meetings = {
      "Select Players": {
        actionName: "Select Players (0-5)",
        states: ["Night"],
        flags: ["voting", "multi"],
        targets: { include: ["alive"], exclude: ["", "self"] },
        multiMin: 0,
        multiMax: 5,
        action: {
          labels: ["investigate", "role"],
          priority: PRIORITY_INVESTIGATIVE_DEFAULT - 2,
          run: function () {
            this.actor.role.data.targetPlayer = this.target;
          },
        },
      },
      "Select Roles": {
        actionName: "Select Roles (0-5)",
        states: ["Night"],
        flags: ["voting", "multi"],
        inputType: "role",
        targets: { include: ["all"] },
        multiMin: 0,
        multiMax: 5,
        action: {
          labels: ["investigate", "role"],
          priority: PRIORITY_INVESTIGATIVE_DEFAULT - 1,
          run: function () {
            this.actor.role.data.targetRole = this.target;
          },
        },
      },
      "Confirm Guesses": {
        states: ["Night"],
        flags: ["voting"],
        inputType: "boolean",
        action: {
          labels: ["investigate"],
          priority: PRIORITY_INVESTIGATIVE_DEFAULT,
          run: function () {
            if (this.target === "No") return;

            let correctCount = 0;

            let playerSize = this.actor.role.data.targetPlayer.length;
            let roleSize = this.actor.role.data.targetRole.length;
            let validSize;
            if (roleSize > playerSize) {
              validSize = playerSize;
            } else {
              validSize = roleSize;
            }

            let targetPlayer;
            let targetRole;
            for (let x = 0; x < validSize; x++) {
              targetPlayer = this.actor.role.data.targetPlayer[x];
              targetRole = this.actor.role.data.targetRole[x];
              if (targetPlayer && targetRole) {
                if (targetRole === targetPlayer.role.name) {
                  correctCount = correctCount + 1;
                }
                this.actor.queueAlert(
                  `:invest: You guessed ${targetPlayer.name} as ${targetRole}.`
                );
              }
            }

            this.actor.queueAlert(
              `:invest: After a long night of investigations, you learn that ${correctCount} of your guesses were correct.`
            );
            delete this.actor.role.data.targetPlayer;
            delete this.actor.role.data.targetRole;
          },
        },
      },
    };
  }
};
