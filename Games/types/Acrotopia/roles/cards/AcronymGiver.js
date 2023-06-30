const Card = require("../../Card");

module.exports = class AcronymGiver extends Card {
  constructor(role) {
    super(role);

    this.meetings = {
      "Give Acronym": {
        actionName: "Give Acronym (1-100)",
        states: ["Night"],
        flags: ["voting"],
        inputType: "text",
        textOptions: {
          minLength: 1,
          maxLength: 100,
          submit: "Confirm",
        },
        action: {
          item: this,
          run: function () {
            // check to see if it is an acronym
            let firstLetters = str.match(/\b\w/g).join('');
            if (firstLetters !== this.game.acronym)
              return;
            this.game.recordAcronym(this.actor, this.target);
            this.actor.role.data.currentAnswer = this.target;
          },
        },
      },
      "Pick Favorite Acronym": {
        actionName: "Pick Favorite Acronym",
        states: ["Day"],
        flags: ["voting"],
        inputType: "custom",
        targets: this.game.expandedAcronyms,
        action: {
          item: this,
          run: function () {
            this.game.recordVote(this.target);
          },
        },
      },
    };
    this.listeners = {
      state: function (stateInfo) {
        if (!stateInfo.name.match(/Night/)) {
          return;
        }

        // map them and filter
        playerAcronym = this.data.currentAnswer;
        let acronyms = this.game.currentAcronymHistory.map((a) => a.acronym);
        let filteredList = acronyms.filter((p) => p != playerAcronym)
        this.meetings["Pick Favorite Acronym"].targets = filteredList;
      },
    }
  }
};