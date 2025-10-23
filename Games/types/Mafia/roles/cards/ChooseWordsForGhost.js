const Card = require("../../Card");
const { PRIORITY_CONVERT_DEFAULT } = require("../../const/Priority");
const { addArticle } = require("../../../../core/Utils");
module.exports = class ChooseWordsForGhost extends Card {
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
          return (
            this.hasBeenDusk != true &&
            this.game.players.filter((p) => p.role.name == "Ghost").length > 0
          );
        },
        action: {
          priority: PRIORITY_CONVERT_DEFAULT - 1,
          run: function () {
            this.game.realWord = this.target;
            role.game.wordLength = role.game.realWord.length;
            role.game.GhostHaveClueMeeting = true;

            this.game.HasSentGhostStartingMessage == true;
            for (let player of this.game.players) {
              if (player.role.name == "Ghost") {
                player.queueAlert(
                  `Guess the hidden word of length: ${this.game.wordLength}`
                );
              }
            }
            let fakeWordGetters = ["Miller", "Sleepwalker", "Braggart"];
            let noWordGetters = ["Saint", "Seer", "Templar"];

            let villagePlayers = this.game.players.filter(
              (p) =>
                p.role.alignment === "Village" &&
                !(
                  ((fakeWordGetters.includes(p.role.name) ||
                    noWordGetters.includes(p.role.name)) &&
                    p.role.canDoSpecialInteractions()) ||
                  (p.role.modifier &&
                    p.role.modifier.split("/").includes("Insane"))
                )
            );
            let fakeWordPlayers = this.game.players.filter(
              (p) =>
                (fakeWordGetters.includes(p.role.name) &&
                  p.role.canDoSpecialInteractions()) ||
                (p.role.modifier &&
                  p.role.modifier.split("/").includes("Insane"))
            );

            for (let villagePlayer of villagePlayers) {
              villagePlayer.role.data.assignedWord = this.game.realWord;
              villagePlayer.queueAlert(
                `The secret word is: ${this.game.realWord}.`
              );
            }

            for (let fakePlayer of fakeWordPlayers) {
              fakePlayer.role.data.assignedWord = this.game.fakeWord;
              fakePlayer.queueAlert(
                `The secret word is: ${this.game.fakeWord}.`
              );
            }
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
          return (
            this.hasBeenDusk != true &&
            this.game.players.filter((p) => p.role.name == "Ghost").length > 0
          );
        },
        action: {
          priority: PRIORITY_CONVERT_DEFAULT - 5,
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
