const Card = require("../../Card");

module.exports = class ResponseGiver extends Card {
  constructor(role) {
    super(role);

    this.meetings = {
      "Give Response": {
        actionName: "Respond to Prompt (1-200)",
        states: ["Night"],
        flags: ["voting"],
        inputType: "text",
        textOptions: {
          minLength: 1,
          maxLength: 200,
          enforceAcronym: "",
          submit: "Confirm",
        },
        action: {
          item: this,
          run: function () {
            if (this.game.promptMode) {
              if (this.game.hasAlien) {
                this.game.addResponse(this.target);
              }
              if (this.game.hasNeighbor) {
                //this.game.addResponse(this.game.questionNeighbor[this.actor]);
                this.game.responseNeighbor[this.actor.name] = this.target;
              }
            } else {
              this.game.recordResponse(this.actor, this.target);
            }
          },
        },
        shouldMeet: function () {
          if (this.game.hasHost && this.game.hostChoosePrompts) {
            return false;
          }
          if (this.game.hasGambler) {
            return false;
          }
          return (
            !this.game.hasNeighbor || this.player.name != this.game.realAnswerer
          );
        },
      },
      "Make Your Decision": {
        actionName: "Make Your First Decision (1-200)",
        states: ["Night"],
        flags: ["voting"],
        inputType: "text",
        textOptions: {
          minLength: 1,
          maxLength: 200,
          enforceAcronym: "",
          submit: "Confirm",
        },
        action: {
          priority: -3,
          run: function () {
            this.actor.role.data.FirstDecision = this.target;
            /*
            this.game.Decisions[
              this.game.currentQuestion.indexOf(this.target)
            ]++;
            this.game.DecisionLog[
              this.game.currentQuestion.indexOf(this.target)
            ].push(this.actor.name);
            */
          },
        },
        shouldMeet: function () {
          if (this.game.hasGambler && this.player == this.game.guesser) {
            return true;
          }

          return false;
        },
      },
      "Make Your Decision 2": {
        actionName: "Make Your First Decision (1-200)",
        states: ["Night"],
        flags: ["voting"],
        inputType: "text",
        textOptions: {
          minLength: 1,
          maxLength: 200,
          enforceAcronym: "",
          submit: "Confirm",
        },
        action: {
          priority: -2,
          run: function () {
            //this.actor.role.data.FirstDecision = this.target;
            this.game.currentQuestion = [
              this.actor.role.data.FirstDecision,
              this.target,
            ];
            this.queueAlert(
              `Would you rather "${this.game.currentQuestion[0]}" OR "${this.game.currentQuestion[1]}"?`
            );
          },
        },
        shouldMeet: function () {
          if (this.game.hasGambler && this.player == this.game.guesser) {
            return true;
          }

          return false;
        },
      },
    };

    this.listeners = {
      start: function () {
        if (!this.game.hasGovernor) return;
        if (!this.game.enablePunctuation) {
          this.meetings["Give Response"].textOptions.alphaOnlyWithSpaces = true;
        }
      },
      state: function (stateInfo) {
        if (!stateInfo.name.match(/Night/)) {
          return;
        }

        if (this.game.hasGambler) {
          this.meetings["Make Your Decision"].targets =
            this.game.currentQuestion;
          return;
        }

        if (!this.game.hasGovernor) return;

        this.meetings["Give Response"].textOptions.enforceAcronym =
          this.game.currentQuestion;
      },
    };
  }
};
