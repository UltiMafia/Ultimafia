const Card = require("../../Card");

module.exports = class PromptMaker extends Card {
  constructor(role) {
    super(role);

    for (let x = 0; x < role.game.roundAmt; x++) {
      this.meetings[`Create Prompt ${x}`] = {
        actionName: "Create Prompt (1-200)",
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
            if (this.game.hasGovernor) {
              this.target = this.target.toUpperCase();
              for (let x = 0; x < this.target.length; x++) {
                this.target = this.target.replace(" ", "");
                this.target = this.target.replace("[^a-zA-Z]", "");
              }
            }
            this.game.addResponse(this.target);
          },
        },
        shouldMeet: function (meetingName) {
          return this.game.hasHost && this.game.hostChoosePrompts;
        },
      };
    }
    /*
    this.meetings = {
      "Create Prompt": {
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
    */
  }
};
