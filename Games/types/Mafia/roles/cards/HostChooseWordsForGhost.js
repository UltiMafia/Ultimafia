const Card = require("../../Card");
const { PRIORITY_CONVERT_DEFAULT } = require("../../const/Priority");
const { addArticle } = require("../../../../core/Utils");
module.exports = class HostChooseWordsForGhost extends Card {
  constructor(role) {
    super(role);
    //const targetOptions = this.game.PossibleRoles.filter((r) => r);
    ///const playerCount = this.game.players.length;

    this.meetings = {
      "Choose Village Word": {
        states: ["Dusk", "Dawn"],
        flags: ["voting"],
        inputType: "text",
        textOptions: {
          minLength: 1,
          maxLength: 12,
          submit: "Confirm",
        },
        shouldMeet: function () {
          return (this.hasBeenDusk != true && this.game.players.filter((p) => p.role.name == "Ghost").length > 0);
        },
        action: {
          priority: PRIORITY_CONVERT_DEFAULT - 1,
          run: function () {
            this.game.realWord = this.target;
          },
        },
      },
      "Choose Fake Word": {
        states: ["Dusk", "Dawn"],
        flags: ["voting"],
        inputType: "text",
        textOptions: {
          minLength: 1,
          maxLength: 12,
          submit: "Confirm",
        },
        shouldMeet: function () {
          return (this.hasBeenDusk != true && this.game.players.filter((p) => p.role.name == "Ghost").length > 0);
        },
        action: {
          priority: PRIORITY_CONVERT_DEFAULT - 1,
          run: function () {
            this.game.fakeWord = this.target;
          },
        },
      },
    };

    this.listeners = {
      roleAssigned: function (player) {
        if (player !== this.player) {
          return;
        }
        this.hasBeenDusk = false;
      },
      // refresh cooldown
      state: function (stateInfo) {
        if (stateInfo.name.match(/Day/) || stateInfo.name.match(/Night/)) {
          this.hasBeenDusk = true;
        }
      },
    };
  }
};
