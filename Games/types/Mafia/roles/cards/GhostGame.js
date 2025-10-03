const Card = require("../../Card");
const Action = require("../../Action");
const Random = require("../../../../../lib/Random");
const wordList = require("../../../../../data/words");
const {
  PRIORITY_WIN_CHECK_DEFAULT,
  PRIORITY_DAY_EFFECT_DEFAULT,
} = require("../../const/Priority");
const { PRIORITY_ITEM_GIVER_DEFAULT } = require("../../const/Priority");

module.exports = class GhostGame extends Card {
  constructor(role) {
    super(role);

    // Select a real word and a fake word
    let wordPack = Random.randArrayVal(wordList);
    let shuffledWordPack = Random.randomizeArray(wordPack);
    if (
      !role.game.realWord &&
      role.game.players.filter((p) => p.role && p.role.name == "Host").length <=
        0
    ) {
      role.game.realWord = shuffledWordPack[0];
      role.game.fakeWord = shuffledWordPack[1];
      role.game.wordLength = role.game.realWord.length;
      role.game.GhostHaveClueMeeting = true;
    }

    this.listeners = {
      state: function (stateInfo) {
        if (!stateInfo.name.match(/Day/)) {
          return;
        }
        if (
          !this.game.GhostCluesLisited &&
          this.game.GhostClues &&
          this.game.GhostClues.length > 0
        ) {
          this.game.GhostCluesLisited = true;
          this.game.sendAlert("Clues");
          for (let clue of this.game.GhostClues) {
            this.game.sendAlert(clue);
          }
        }

        var action = new Action({
          role: this,
          actor: this.player,
          game: this.player.game,
          priority: PRIORITY_DAY_EFFECT_DEFAULT + 1,
          labels: ["hidden", "absolute"],
          run: function () {
            let alivePlayers = this.game.players.filter((p) => p.role);

            for (let x = 0; x < alivePlayers.length; x++) {
              for (let action of this.game.actions[0]) {
                if (
                  action.target == alivePlayers[x] &&
                  action.hasLabel("condemn")
                ) {
                  this.game.GhostHaveClueMeeting = false;
                  return;
                }
              }
            }
            this.game.GhostHaveClueMeeting = true;
            return;
          },
        });
        this.game.queueAction(action);
      },
      roleAssigned: function (player) {
        if (player !== this.player) return;
        for (let player of this.game.players) {
          if (player.role.name == "Ghost" && player != this.player) {
            this.revealToPlayer(player);
          }
        }
        if (this.game.HasSentGhostStartingMessage == true) {
          return;
        }
        if (!this.game.realWord) {
          return;
        }
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
              (p.role.modifier && p.role.modifier.split("/").includes("Insane"))
            )
        );
        let fakeWordPlayers = this.game.players.filter(
          (p) =>
            (fakeWordGetters.includes(p.role.name) &&
              p.role.canDoSpecialInteractions()) ||
            (p.role.modifier && p.role.modifier.split("/").includes("Insane"))
        );

        for (let villagePlayer of villagePlayers) {
          villagePlayer.role.data.assignedWord = this.game.realWord;
          villagePlayer.queueAlert(
            `The secret word is: ${this.game.realWord}.`
          );
        }

        for (let fakePlayer of fakeWordPlayers) {
          fakePlayer.role.data.assignedWord = this.game.fakeWord;
          fakePlayer.queueAlert(`The secret word is: ${this.game.fakeWord}.`);
        }
      },
      aboutToFinish: function(){
        if(this.game.realWord){
          this.game.queueAlert(`The real word was ${this.game.realWord}.`);
        }
        if(this.game.fakeWord){
          this.game.queueAlert(`The fake word was ${this.game.fakeWord}.`);
        }
      },
    };

    this.meetings = {
      Ghost: {
        actionName: "Select Leader",
        states: ["Night"],
        flags: ["group", "speech", "voting", "mustAct", "instant"],
        targets: { include: ["alive"], exclude: ["dead"] },
        shouldMeet: function () {
          return this.game.GhostHaveClueMeeting;
        },
        action: {
          priority: PRIORITY_ITEM_GIVER_DEFAULT,
          run: function () {
            if(!this.target.alive){
              this.target = Random.randArrayVal(this.game.alivePlayers().filter((p) => p.role && p.role.name != "Host"));
            }
            this.game.PlayersWhoGaveClue = [];
            this.target.holdItem("Ouija Board");
          },
        },
      },
      "Guess Word": {
        states: ["Dusk"],
        flags: ["instant", "voting"],
        inputType: "text",
        textOptions: {
          minLength: 2,
          maxLength: 20,
          alphaOnly: true,
          toLowerCase: true,
          submit: "Confirm",
        },
        action: {
          run: function () {
            let word = this.target.toLowerCase();
            this.game.queueAlert(`${this.actor.name} guesses ${word}.`);

            this.actor.role.guessedWord = word;
            if (word !== this.game.realWord) {
              this.actor.kill();
            }

            this.actor.role.guessOnNext = false;
          },
        },
        shouldMeet: function () {
          for (let action of this.game.actions[0]) {
            if (action.target == this.player && action.hasLabel("condemn")) {
              return true;
            }
          }
          return false;
        },
      },
    };

    this.winCheck = {
      priority: PRIORITY_WIN_CHECK_DEFAULT,
      check: function (counts, winners, aliveCount) {
        const numGhostAlive = this.game.players.filter(
          (p) => p.alive && p.role.name == "Ghost"
        ).length;
        if (!this.game.realWord) {
          return;
        }
        if (
          (aliveCount > 0 && numGhostAlive >= aliveCount / 2) ||
          this.guessedWord === this.game.realWord
        ) {
          winners.addPlayer(this.player, this.name);
        }
      },
    };

    this.stateMods = {
      Day: {
        type: "shouldSkip",
        shouldSkip: function () {
          for (let player of this.game.alivePlayers()) {
            if (player.hasItem("Ouija Board")) {
              return true;
            }
          }
          return false;
        },
      },
      Dusk: {
        type: "shouldSkip",
        shouldSkip: function () {
          for (let player of this.game.alivePlayers()) {
            if (player.hasItem("Ouija Board")) {
              return true;
            }
          }
          return false;
        },
      },
      Night: {
        type: "shouldSkip",
        shouldSkip: function () {
          for (let player of this.game.alivePlayers()) {
            if (player.hasItem("Ouija Board")) {
              return true;
            }
          }
          return false;
        },
      },
      Dawn: {
        type: "shouldSkip",
        shouldSkip: function () {
          for (let player of this.game.alivePlayers()) {
            if (player.hasItem("Ouija Board")) {
              return true;
            }
          }
          return false;
        },
      },
    };
  }
  /*
  assignWordsToPlayers() {
    let villagePlayers = this.game.players.filter(
      (p) => p.role.alignment === "Village"
    );
    let mafiaOrCultPlayers = this.game.players.filter(
      (p) => p.role.alignment === "Mafia" || p.role.alignment === "Cult"
    );

    for (let villagePlayer of villagePlayers) {
      villagePlayer.role.data.assignedWord = this.realWord;
      villagePlayer.queueAlert(`The secret word is: ${this.realWord}.`);
    }

    for (let mafiaOrCultPlayer of mafiaOrCultPlayers) {
      mafiaOrCultPlayer.role.data.assignedWord = this.fakeWord;
      mafiaOrCultPlayer.queueAlert(`The secret word is: ${this.fakeWord}.`);
    }
  }
    */
};
