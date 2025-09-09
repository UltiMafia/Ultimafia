const Card = require("../../Card");
const Random = require("../../../../../lib/Random");
const wordList = require("../../../../../data/words");
const { PRIORITY_WIN_CHECK_DEFAULT } = require("../../const/Priority");

module.exports = class GhostGame extends Card {
  constructor(role) {
    super(role);

    // Select a real word and a fake word
    let wordPack = Random.randArrayVal(wordList);
    let shuffledWordPack = Random.randomizeArray(wordPack);
    if(!role.game.realWord){
      role.game.realWord = shuffledWordPack[0];
      role.game.fakeWord = shuffledWordPack[1];
      role.game.wordLength = role.game.realWord.length;
    }

    this.listeners = {
      roleAssigned: function (player) {
         if (player !== this.player) return;
        for (let player of this.game.players) {
          if (player.role.name == "Ghost" && player != this.player) {
            this.revealToPlayer(player);
          }
        }
        if(this.game.HasSentGhostStartingMessage == true){
          return;
        }
        this.game.HasSentGhostStartingMessage == true;
        for(let player of this.game.players){
          if(player.role.name == "Ghost"){
            player.queueAlert(
          `Guess the hidden word of length: ${this.game.wordLength}`
        );
          }
        }
      let fakeWordGetters = [
        "Miller",
        "Sleepwalker",
        "Braggart",
      ];
      let noWordGetters = [
        "Saint",
        "Seer",
        "Templar",
      ];

      let villagePlayers = this.game.players.filter(
      (p) => p.role.alignment === "Village" && !(((fakeWordGetters.includes(p.role.name) || noWordGetters.includes(p.role.name)) && p.role.canDoSpecialInteractions())
      || (p.role.modifier && p.role.modifier.split("/").includes("Insane"))) 
    );
    let fakeWordPlayers = this.game.players.filter(
      (p) => ((fakeWordGetters.includes(p.role.name)) && p.role.canDoSpecialInteractions()) || (p.role.modifier && p.role.modifier.split("/").includes("Insane"))
    );

    for (let villagePlayer of villagePlayers) {
      villagePlayer.role.data.assignedWord = this.game.realWord;
      villagePlayer.queueAlert(`The secret word is: ${this.game.realWord}.`);
    }

    for (let fakePlayer of fakeWordPlayers) {
      mafiaOrCultPlayer.role.data.assignedWord = this.game.fakeWord;
      mafiaOrCultPlayer.queueAlert(`The secret word is: ${this.game.fakeWord}.`);
    }

        
      },
    };

    this.meetings = {
      Ghost: {
        actionName: "Select Leader",
        states: ["Night"],
        flags: ["group", "speech", "voting", "mustAct"],
        targets: { include: ["alive"], exclude: ["dead"] },
        action: {
          run: function () {
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
        if (
          (aliveCount > 0 && numGhostAlive >= aliveCount / 2) ||
          this.guessedWord === this.game.realWord
        ) {
          winners.addPlayer(this.player, this.name);
        }
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
