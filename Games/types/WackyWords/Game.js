const Game = require("../../core/Game");
const Player = require("./Player");
const Action = require("./Action");
const Queue = require("../../core/Queue");
const Random = require("../../../lib/Random");
const Winners = require("../../core/Winners");
const ArrayHash = require("../../core/ArrayHash");

const questionList = require("./data/questions");
const neighborQuestionList = require("./data/neighborQuestions");
const decisionsList = require("./data/decisions");

module.exports = class WackyWordsGame extends Game {
  constructor(options) {
    super(options);

    this.type = "Wacky Words";
    this.Player = Player;
    this.states = [
      {
        name: "Postgame",
      },
      {
        name: "Pregame",
      },
      {
        name: "Night",
        length: options.settings.stateLengths["Night"],
      },
      {
        name: "Day",
        length: options.settings.stateLengths["Day"],
        skipChecks: [() => this.promptMode],
      },
    ];

    // game settings
    this.roundAmt = options.settings.roundAmt;
    this.acronymSize = options.settings.acronymSize;
    this.enablePunctuation = options.settings.enablePunctuation;
    this.standardiseCapitalisation = options.settings.standardiseCapitalisation;
    this.turnOnCaps = options.settings.turnOnCaps;

    this.hasAlien = this.setup.roles[0]["Alien:"];
    this.hasNeighbor = this.setup.roles[0]["Neighbor:"];
    this.hasGovernor = this.setup.roles[0]["Governor:"];
    this.hasGambler = this.setup.roles[0]["Gambler:"];
    this.hasHost = this.setup.roles[0]["Host:"];
    // cannot be both game modes
    let possible = [];
    if (this.hasAlien) {
      possible.push("Alien");
    }
    if (this.hasNeighbor) {
      possible.push("Neighbor");
    }
    if (this.hasGovernor) {
      possible.push("Governor");
    }
    if (this.hasGambler) {
      possible.push("Gambler");
    }
    if (possible.length > 1) {
      possible = Random.randomizeArray(possible);
      if (possible[0] == "Alien") {
        this.hasNeighbor = false;
        this.hasGovernor = false;
        this.hasGambler = false;
      }
      if (possible[0] == "Neighbor") {
        this.hasAlien = false;
        this.hasGovernor = false;
        this.hasGambler = false;
      }
      if (possible[0] == "Governor") {
        this.hasNeighbor = false;
        this.hasAlien = false;
        this.hasGambler = false;
      }
      if (possible[0] == "Gambler") {
        this.hasNeighbor = false;
        this.hasAlien = false;
        this.hasGovernor = false;
      }
    }
    if (this.hasAlien || this.hasNeighbor) {
      this.hasHost = false;
    }

    this.currentRound = 0;
    this.currentResponse = "";
    this.shuffledQuestions = Random.randomizeArray(questionList);
    this.secondPromptBank = this.shuffledQuestions;
    this.promptMode = false;
    this.responseNeighbor = {};
    this.questionNeighbor = {};

    // map from response to player
    this.currentResponses = new ArrayHash();

    this.responseHistory = [];
    this.currentResponseHistory = [];

    // hacky implementation
    this.playerHasVoted = {};
  }

  start() {
    if (this.hasHost) {
      this.hostChoosePrompts = true;
      this.promptMode = true;
      this.shuffledQuestions = [];
    }
    if (this.hasGambler) {
      this.shuffledQuestions = Random.randomizeArray(decisionsList);
      this.secondPromptBank = this.shuffledQuestions;
    }
    if (this.hasAlien) {
      this.shuffledQuestions = [];
      this.promptMode = true;
    }
    if (this.hasNeighbor) {
      this.shuffledQuestions = [];
      this.questionNeighbor = {};
      this.promptMode = true;
      this.secondPromptBank = Random.randomizeArray(neighborQuestionList);
    }

    super.start();
  }

  incrementState() {
    super.incrementState();

    this.clearVoted();
    if (this.getStateName() == "Night") {
      this.saveResponseHistory("name");
      this.emptyResponseHistory();
      if (this.shuffledQuestions.length > 0) {
        this.promptMode = false;
        this.hostChoosePrompts = false;
      }
      if (this.hostChoosePrompts) {
        if (this.hasGovernor) {
          this.queueAlert(`Host is choosing Acronyms!`);
        } else {
          this.queueAlert(`Host is choosing Prompts!`);
        }
      } else if (this.promptMode) {
        // if generating questions round
        if (this.hasAlien) {
          this.generateNewPrompt();
        } else {
          this.generatePlayerQuestions();
        }
      } else {
        if (this.hasGovernor && !this.hasHost) {
          this.generateNewAcronym();
        } else if (this.hasGambler) {
          this.generateNewDecision();
        } else {
          this.generateNewQuestion();
        }
      }
      return;
    }

    if (this.getStateName() == "Day") {
      this.saveResponseHistory("anon");
      let action = new Action({
        actor: {
          role: undefined,
        },
        game: this,
        run: function () {
          if (this.game.hasNeighbor) {
            this.game.neighborTabulateScores();
          } else if (this.game.hasGambler) {
            this.game.gamblerTabulateScores();
          } else {
            this.game.tabulateScores();
          }
        },
      });
      this.currentRound += 1;
      if (this.shuffledQuestions.length == 0) {
        this.promptMode = true;
      }
      if (this.hasNeighbor) {
        if (this.currentRound == 0) {
          this.queueAlert(
            `Guess which one you believe the player mentioned really answered!`
          );
        }
      }
      this.queueAction(action);
    }
  }

  generateNewQuestion() {
    this.promptMode = false;

    let question = this.shuffledQuestions[0];
    let playerIndex = Random.randInt(0, this.players.length - 1);
    let playerName = this.players.at(playerIndex).name;
    question = question.replace("$player", playerName);
    question = question.replace("$blank", "____");
    this.shuffledQuestions.shift();

    this.currentQuestion = question;
    if (this.hasGovernor) {
      this.queueAlert(`The acronym is "${question}".`);
    } else {
      this.queueAlert(`The prompt is "${question}".`);
    }

    if (this.hasNeighbor) {
      for (let player of this.players) {
        if (this.currentQuestion.search(player.name) > -1) {
          this.realAnswer = this.responseNeighbor[player.name];
          this.realAnswerer = player.name;
          this.recordResponse(player, this.realAnswer);
          //player.holdItem("CannotRespond");
        }
      }
    }

    if (this.currentRound == 0) {
      if (this.hasAlien) {
        this.queueAlert(
          `Create a question that the prompt given is responding to. Go wild!`
        );
      } else if (this.hasGovernor) {
        this.queueAlert(
          `Create a word phrase starting with these letters. Go wild!`
        );
      } else {
        this.queueAlert(`Give a response to the prompt given. Go wild!`);
      }
    }
  }

  generateNewDecision() {
    this.promptMode = false;
    var alive = this.players.filter((p) => p.alive && p.role.name != "Host");
    if (this.guesser == null || !this.guesser.alive) {
      this.guesser = alive[0];
      this.queueAlert(`${this.guesser.name} is now the Asker.`);
    }
    /*
    let question1 = this.shuffledQuestions[0][0];
    let question2 = this.shuffledQuestions[0][1];
    let playerIndex = Random.randInt(0, this.players.length - 1);
    let playerName = this.players.at(playerIndex).name;
    let OtherPlayerName = Random.randArrayVal(
      this.players.filter((p) => p.name != playerName)
    ).name;
    question1 = question1.replace("$player", playerName);
    question1 = question1.replace("$OtherPlayer", OtherPlayerName);
    question1 = question1.replace("$blank", "____");
    question2 = question2.replace("$player", playerName);
    question2 = question2.replace("$OtherPlayer", OtherPlayerName);
    question2 = question2.replace("$blank", "____");
    this.shuffledQuestions.shift();
*/
    this.currentQuestion = ["Placeholder"];
    //this.queueAlert(`Would you rather "${question1}" OR "${question2}"?`);
    this.Decisions = [0.0, 0.0];
    this.DecisionLog = [[], []];

    if (this.currentRound == 0) {
      this.queueAlert(`Make your Selection. Go wild!`);
    }
  }

  generateNewAcronym() {
    this.promptMode = false;
    // JQVXZ are less likely to appear
    const characters = "ABCDEFGHIKLMNOPRSTUWYABCDEFGHIJKLMNOPQRSTUVWXYZ";
    let acronym = "";
    for (var i = 0; i < this.acronymSize; i++) {
      acronym += characters.charAt(
        Math.floor(Math.random() * characters.length)
      );
    }
    this.currentQuestion = acronym;
    this.queueAlert(`The acronym is ${acronym}.`);

    if (this.currentRound == 0) {
      this.queueAlert(
        `Give a ${this.acronymSize}-word phrase starting with these letters. Go wild!`
      );
    }
  }

  generateNewPrompt() {
    var alive = this.players.filter((p) => p.alive && p.role.name != "Host");
    for (let player of alive) {
      let question = this.secondPromptBank[0];
      let playerIndex = Random.randInt(0, this.players.length - 1);
      let playerName = this.players.at(playerIndex).name;
      question = question.replace("$player", playerName);
      question = question.replace("$blank", "____");

      this.secondPromptBank.shift();

      player.queueAlert(`:journ: Your prompt is "${question}".`);
    }
    this.currentQuestion = "Your prompt is displayed in the chat!";

    if (this.currentRound == 0) {
      this.queueAlert(`Give a response to the prompt given. Go wild!`);
    }
  }

  generatePlayerQuestions() {
    var alive = this.players.filter((p) => p.alive && p.role.name != "Host");
    for (let player of alive) {
      let question = this.secondPromptBank[0];
      question = question.replace("$player", player.name);
      question = question.replace("$blank", "____");
      this.shuffledQuestions.push(question);

      this.secondPromptBank.shift();

      player.queueAlert(`:journ: Your prompt is "${question}".`);
    }
    this.currentQuestion = "Your prompt is displayed in the chat!";

    if (this.currentRound == 0) {
      this.queueAlert(`Give a response to the prompt given. Go wild!`);
    }
  }

  addResponse(response) {
    this.shuffledQuestions.push(response);
    this.shuffledQuestions = Random.randomizeArray(this.shuffledQuestions);
  }

  recordResponse(player, response) {
    this.currentResponses[response] = {
      player: player,
      voters: [],
      score: 0,
      name: response,
    };
  }

  recordVote(player, response, ranking) {
    if(this.currentResponses[response].voters.includes(player)){
      return;
    }
    this.currentResponses[response].voters.push(player);
    if(ranking == null){
    this.currentResponses[response].score += 1;
    }
    else{
      this.currentResponses[response].score += ranking;
    }
  }

  tabulateScores() {
    let winningScore = 1;
    let winningResponses = [];

    for (let response in this.currentResponses) {
      let responseObj = this.currentResponses[response];
      if (responseObj.score == winningScore) {
        winningResponses.push(response);
        continue;
      }

      if (responseObj.score > winningScore) {
        winningScore = responseObj.score;
        winningResponses = [];
        winningResponses.push(response);
        continue;
      }
    }

    this.queueAlert(
      `The winning response(s) for "${this.currentQuestion}" are…`
    );

    let hasMultipleWinners = winningResponses.length > 1;
    let scoreToGive = hasMultipleWinners
      ? Math.round(10 / winningResponses.length)
      : 10;
    for (let response of winningResponses) {
      let responseObj = this.currentResponses[response];
      responseObj.player.addScore(scoreToGive);
      responseObj.isWinner = true;
      this.queueAlert(`${responseObj.player.name}: ${response}`);
    }
  }

  saveResponseHistory(type) {
    let currentResponseHistory = [];

    for (let response in this.currentResponses) {
      let responseObj = this.currentResponses[response];
      let responseObjToSave = {
        name: responseObj.name,
        player: responseObj.player.name,
        voters: responseObj.voters.map((v) => v.name),
        score: responseObj.score,
        isWinner: responseObj.isWinner || false,
      };
      switch (type) {
        case "anon":
          responseObjToSave.display = "-";
          break;
        case "name":
          responseObjToSave.display = responseObjToSave.player;
          break;
      }
      currentResponseHistory.push(responseObjToSave);
    }
    this.responseHistory = Random.randomizeArray(currentResponseHistory);
  }

  neighborTabulateScores() {
    let trueResponse = this.realAnswer;

    for (let response in this.currentResponses) {
      let responseObj = this.currentResponses[response];

      if (responseObj.name == trueResponse) {
        responseObj.player.addScore(responseObj.voters.length * 2);
        for (let player of responseObj.voters) {
          if (player.role.name != "Host") {
            player.addScore(2);
          }
        }
        this.queueAlert(
          `${responseObj.voters.length} ${
            responseObj.voters.length == 1 ? "person" : "people"
          } guessed the truth!`
        );
      } else {
        responseObj.player.addScore(responseObj.voters.length * 1);
        if (responseObj.voters.length > 0) {
          this.queueAlert(
            `${responseObj.player.name} fooled ${responseObj.voters.length} ${
              responseObj.voters.length == 1 ? "person" : "people"
            }!`
          );
        }
      }
    }

    this.queueAlert(
      `The true response for "${this.currentQuestion}" was "${trueResponse}".`
    );
  }

  gamblerTabulateScores() {
    let trueResponse = this.realAnswer;

    let question1Pickers = [];
    let question2Pickers = [];

    let total = this.Decisions[0] + this.Decisions[1];
    let greater = false;
    if (this.Decisions[0] == this.Decisions[1]) {
      this.guesser.addScore(10);
      this.queueAlert(`${this.guesser.name} has created a Perfect Split!!!!`);
    } else if (this.Decisions[0] > this.Decisions[1]) {
      greater = this.Decisions[0];
    } else {
      greater = this.Decisions[1];
    }

    if (greater != false) {
      let fraction = greater / total - 0.5;
      if (fraction <= 0.1) {
        this.guesser.addScore(8);
        this.queueAlert(`${this.guesser.name} has created a good Split!!`);
      } else if (fraction <= 0.2) {
        this.guesser.addScore(6);
        this.queueAlert(`${this.guesser.name} has created a decent Split!!`);
      } else if (fraction <= 0.25) {
        this.guesser.addScore(4);
        this.queueAlert(`${this.guesser.name} has created an OK Split!!`);
      } else if (fraction <= 0.3) {
        this.guesser.addScore(2);
        this.queueAlert(`${this.guesser.name} has created a poor Split!!`);
      } else if (fraction <= 0.49) {
        this.guesser.addScore(1);
        this.queueAlert(`${this.guesser.name} has created a bad Split!`);
      } else {
        this.queueAlert(`${this.guesser.name} has failed to make a Split.`);
      }
    }

    if (this.DecisionLog[0].length < 1) {
      this.DecisionLog[0].push("No one");
    }
    if (this.DecisionLog[1].length < 1) {
      this.DecisionLog[1].push("No one");
    }
    this.queueAlert(
      `${this.DecisionLog[0].join(", ")} selected "${this.currentQuestion[0]}".`
    );
    this.queueAlert(
      `${this.DecisionLog[1].join(", ")} selected "${this.currentQuestion[1]}".`
    );

    var alive = this.players.filter((p) => p.alive && p.role.name != "Host");
    let index = alive.indexOf(this.guesser);
    let rightIdx = (index + 1) % alive.length;
    this.guesser = alive[rightIdx];

    this.queueAlert(`${this.guesser.name} is now the Asker.`);
  }

  emptyResponseHistory() {
    this.currentResponses = new ArrayHash();
  }

  markVoted(player) {
    let previousVote = this.playerHasVoted[player.name];
    this.playerHasVoted[player.name] = true;

    if (!previousVote) {
      this.players.map((p) => p.sendHistory());
    }
  }

  clearVoted() {
    this.playerHasVoted = {};
  }

  getStateInfo(state) {
    var info = super.getStateInfo(state);

    if (this.started && this.hasNeighbor) {
      this.roundAmt = this.players.filter((p) => p.role.name != "Host").length;
    }

    let scores = {};
    for (let p of this.players) {
      scores[p.name] = p.getScore();
    }
    info.extraInfo = {
      responseHistory: this.responseHistory,
      currentQuestion: this.currentQuestion,
      round: info.name.match(/Night/)
        ? this.currentRound + 1
        : this.currentRound,
      totalRound: this.roundAmt,
      scores: scores,
      playerHasVoted: this.playerHasVoted,
    };
    return info;
  }

  checkWinConditions() {
    var finished =
      this.alivePlayers().length <= 2 || this.currentRound >= this.roundAmt;
    if (!finished) {
      return [false, undefined];
    }

    let highestScore = 1;
    let highestPeople = [];
    for (let player of this.players) {
      if (!player.alertSent) {
        this.queueAlert(`${player.name} has ${player.score} points.`);
        player.alertSent = true;
      }
      if (player.score == highestScore) {
        highestPeople.push(player);
      }
      if (player.score > highestScore) {
        highestPeople = [player];
        highestScore = player.score;
      }
    }

    var winners = new Winners(this);
    winners.queueShortAlert = true;
    for (let p of highestPeople) {
      winners.addPlayer(p, p.name);
    }

    if (highestPeople.length == 0) {
      winners.addGroup("No one");
    }

    winners.determinePlayers();
    return [finished, winners];
  }

  // process player leaving immediately
  async playerLeave(player) {
    await super.playerLeave(player);

    if (this.started && !this.finished) {
      let action = new Action({
        actor: player,
        target: player,
        game: this,
        run: function () {
          this.target.kill("leave", this.actor, true);
        },
      });

      this.instantAction(action);
    }
  }

  getGameTypeOptions() {
    return {
      roundAmt: this.roundAmt,
      acronymSize: this.acronymSize,
      enablePunctuation: this.enablePunctuation,
      standardiseCapitalisation: this.standardiseCapitalisation,
      turnOnCaps: this.turnOnCaps,
    };
  }
};
