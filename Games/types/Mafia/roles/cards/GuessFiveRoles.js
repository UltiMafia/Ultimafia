const Card = require("../../Card");
const { PRIORITY_INVESTIGATIVE_DEFAULT } = require("../../const/Priority");
const { addArticle } = require("../../../../core/Utils");

module.exports = class GuessFiveRoles extends Card {
  constructor(role) {
    super(role);

    this.meetings = {
      "First Player": {
        states: ["Night"],
        flags: ["voting"],
        action: {
          priority: PRIORITY_INVESTIGATIVE_DEFAULT - 1,
          run: function () {
            this.actor.role.data.targetPlayer = this.target;
          },
        },
      },
      "First Role": {
        states: ["Night"],
        flags: ["voting"],
        inputType: "role",
        targets: { include: ["all"] },
        action: {
          labels: ["investigate", "role"],
          priority: PRIORITY_INVESTIGATIVE_DEFAULT,
          run: function () {
            this.actor.role.data.targetRole = this.target;
          },
        },
      }, //end of First Guess
      "Second Player": {
        states: ["Night"],
        flags: ["voting"],
        action: {
          priority: PRIORITY_INVESTIGATIVE_DEFAULT - 1,
          run: function () {
            this.actor.role.data.targetPlayer2 = this.target;
          },
        },
      },
      "Second Role": {
        states: ["Night"],
        flags: ["voting"],
        inputType: "role",
        targets: { include: ["all"] },
        action: {
          labels: ["investigate", "role"],
          priority: PRIORITY_INVESTIGATIVE_DEFAULT,
          run: function () {
            this.actor.role.data.targetRole2 = this.target;
          },
        },
      }, //end of 2nd Guess
      "Third Player": {
        states: ["Night"],
        flags: ["voting"],
        action: {
          priority: PRIORITY_INVESTIGATIVE_DEFAULT - 1,
          run: function () {
            this.actor.role.data.targetPlayer3 = this.target;
          },
        },
      },
      "Third Role": {
        states: ["Night"],
        flags: ["voting"],
        inputType: "role",
        targets: { include: ["all"] },
        action: {
          labels: ["investigate", "role"],
          priority: PRIORITY_INVESTIGATIVE_DEFAULT,
          run: function () {
            this.actor.role.data.targetRole3 = this.target;
          },
        },
      }, //end of 3rd Guess
      "Fourth Player": {
        states: ["Night"],
        flags: ["voting"],
        action: {
          priority: PRIORITY_INVESTIGATIVE_DEFAULT - 1,
          run: function () {
            this.actor.role.data.targetPlayer4 = this.target;
          },
        },
      },
      "Fourth Role": {
        states: ["Night"],
        flags: ["voting"],
        inputType: "role",
        targets: { include: ["all"] },
        action: {
          labels: ["investigate", "role"],
          priority: PRIORITY_INVESTIGATIVE_DEFAULT,
          run: function () {
            this.actor.role.data.targetRole4 = this.target;
          },
        },
      }, //end of 4th Guess
      "Fifth Player": {
        states: ["Night"],
        flags: ["voting"],
        action: {
          priority: PRIORITY_INVESTIGATIVE_DEFAULT - 1,
          run: function () {
            this.actor.role.data.targetPlayer5 = this.target;
          },
        },
      },
      "Fifth Role": {
        states: ["Night"],
        flags: ["voting"],
        inputType: "role",
        targets: { include: ["all"] },
        action: {
          labels: ["investigate", "role"],
          priority: PRIORITY_INVESTIGATIVE_DEFAULT,
          run: function () {
            this.actor.role.data.targetRole5 = this.target;
          },
        },
      }, //end of 5th Guess
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

            let targetPlayer = this.actor.role.data.targetPlayer;
            let targetRole = this.actor.role.data.targetRole;
            if (targetPlayer) {
              if (targetRole === targetPlayer.role.name) {
                correctCount = correctCount + 1;
              }
            }
            let targetPlayer2 = this.actor.role.data.targetPlayer2;
            let targetRole2 = this.actor.role.data.targetRole2;
            if (targetPlayer2) {
              if (targetRole2 === targetPlayer2.role.name) {
                correctCount = correctCount + 1;
              }
            }
            let targetPlayer3 = this.actor.role.data.targetPlayer3;
            let targetRole3 = this.actor.role.data.targetRole3;
            if (targetPlayer3) {
              if (targetRole3 === targetPlayer3.role.name) {
                correctCount = correctCount + 1;
              }
            }
            let targetPlayer4 = this.actor.role.data.targetPlayer4;
            let targetRole4 = this.actor.role.data.targetRole4;
            if (targetPlayer4) {
              if (targetRole4 === targetPlayer4.role.name) {
                correctCount = correctCount + 1;
              }
            }
            let targetPlayer5 = this.actor.role.data.targetPlayer5;
            let targetRole5 = this.actor.role.data.targetRole5;
            if (targetPlayer5) {
              if (targetRole5 === targetPlayer5.role.name) {
                correctCount = correctCount + 1;
              }
            }

            this.actor.queueAlert(
              `:invest: After a long night of investigations, you learn that ${correctCount} of your guesses were correct.`
            );
            delete this.actor.role.data.targetPlayer;
            delete this.actor.role.data.targetRole;
            delete this.actor.role.data.targetPlayer2;
            delete this.actor.role.data.targetRole2;
            delete this.actor.role.data.targetPlayer3;
            delete this.actor.role.data.targetRole3;
            delete this.actor.role.data.targetPlayer4;
            delete this.actor.role.data.targetRole4;
            delete this.actor.role.data.targetPlayer5;
            delete this.actor.role.data.targetRole5;
          },
        },
      },
    };
  }
};
