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
          return (
            !this.game.hasNeighbor || this.player.name != this.game.realAnswerer
          );
        },
      },
    };


    this.listeners = {
      start: function () {
        if(!this.game.hasGovernor) return;
        if (!this.game.enablePunctuation) {
          this.meetings["Give Acronym"].textOptions.alphaOnlyWithSpaces = true;
        }
      },
      state: function (stateInfo) {
        if (!stateInfo.name.match(/Night/)) {
          return;
        }
        if(!this.game.hasGovernor) return;

        this.meetings["Give Response"].textOptions.enforceAcronym =
          this.game.currentQuestion;
      },
    };


    
  }
};
