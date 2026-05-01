const Game = require("../../core/Game");
const Player = require("./Player");
const Winners = require("../../core/Winners");
const Queue = require("../../core/Queue");
const generateDeck = require("./generateDeck");
const Random = require("../../../lib/Random");
const fs = require("fs");
const path = require("path");

const ICON_FOLDERS = ["village", "mafia", "cult", "independent"];
const ICONS_BASE = path.join(__dirname, "../../../react_main/src/images/roles");

function getAllIcons() {
  let icons = [];
  for (const folder of ICON_FOLDERS) {
    const files = fs.readdirSync(path.join(ICONS_BASE, folder))
      .filter(f => f.endsWith(".png"))
      .map(f => `${folder}/${f}`);
    icons = icons.concat(files);
  }
  return icons;
}

function pickRandomSymbols(count) {
  const all = getAllIcons();
  return Random.randomizeArray(all).slice(0, count);
}

module.exports = class SpotItGame extends Game {
  constructor(options) {
    super(options);
    this.type = "Spot It";
    this.Player = Player;
    this.states = [
      { name: "Postgame" },
      { name: "Pregame" },
      { name: "Round", length: options.settings.stateLengths["Round"] },
    ];
    this.deck = [];
    this.centerCard = [];
    this.scores = {};
    this.roundNumber = 0;
    
    this.symbols = [];

    this.isWell = this.setup.roles[0]["Weller:"] > 0;
    this.deckSize = options.settings.deckSize || "standard";
  }

  start() {
    const deckSize = this.deckSize;
    const prime = deckSize === "small" ? 5 : deckSize === "large" ? 11 : 7;
    this.symbols = pickRandomSymbols(prime * prime + prime + 1);
    const fullDeck = generateDeck(prime);

    let valid = true;
    for (let i = 0; i < fullDeck.length; i++) {
      for (let j = i + 1; j < fullDeck.length; j++) {
        const shared = fullDeck[i].filter(s => fullDeck[j].includes(s));
        if (shared.length !== 1) {
          valid = false;
        }
      }
    }

    this.deck = Random.randomizeArray(fullDeck);
    this.centerCard = this.deck.pop();

    if (this.isWell) { // The Well Game Mode
      const handSize = Math.floor(this.deck.length / this.players.length);
      for (let player of this.players) {
        player.cardStack = [];
        for (let i = 0; i < handSize; i++) {
          if (this.deck.length > 0) player.cardStack.push(this.deck.pop());
        }
        player.card = player.cardStack[0];
      }
    } else { // The Tower Game Mode
      for (let player of this.players) {
        this.scores[player.id] = 0;
        player.card = this.deck.pop();
      }
    }

    super.start();
  }

  claimMatch(player, symbolPath) {
    const playerSymbols = player.card.map(i => this.symbols[i]);
    const centerSymbols = this.centerCard.map(i => this.symbols[i]);

    if (playerSymbols.includes(symbolPath) && centerSymbols.includes(symbolPath)) {
      this.sendAlert(`${player.name} found a match!`);
      if (this.isWell) {
        this.centerCard = player.card;
        player.cardStack.shift();

        if (player.cardStack.length === 0) {
          this.sendAlert(`${player.name} emptied their stack and wins!`);
          this.immediateEnd();
          return true;
        }

        player.card = player.cardStack[0];
      } else {
        this.scores[player.id]++;

        const oldCenter = this.centerCard;
        player.card = oldCenter;

        if (this.deck.length > 0) {
          this.centerCard = this.deck.pop();
          this.roundNumber++;
        } else {
          this.immediateEnd();
          return true;
        }
      }

      for (let p of this.players) {
        p.getMeetings().forEach((meeting) => {
          if (meeting.name === "Claim Match") meeting.cancel(true, true);
        });
      }

      const stateInfo = this.getStateInfo();
      this.broadcastState(stateInfo);
      this.addStateExtraInfoToHistories(stateInfo.extraInfo, this.currentState);

      return true;
    }
    return false;
  }

  getStateInfo(state) {
    var info = super.getStateInfo(state);
    const playerCards = {};
    for (let player of this.players) {
      playerCards[player.id] = player.card ? player.card.map(i => this.symbols[i]) : [];
    }
    info.extraInfo = {
      centerCard: this.centerCard.map(i => this.symbols[i]),
      playerCards,
      scores: this.scores,
      roundNumber: this.roundNumber,
      symbols: this.symbols,
      isWell: this.isWell,
      cardStackSizes: this.isWell ?
        Object.fromEntries(this.players.map(p => [p.id, p.cardStack?.length || 0])) : {},
    };
    return info;
  }

  async playerLeave(player) {
    await super.playerLeave(player);
    if (this.started && !this.finished) {
      this.sendAlert("A player has left, ending the game.");
      this.immediateEnd();
    }
  }

  checkWinConditions() {
    var finished = false;
    var winQueue = new Queue();
    var winners = new Winners(this);
    var aliveCount = this.alivePlayers().length;

    for (let player of this.players) {
      winQueue.enqueue(player.role.winCheck);
    }

    for (let winCheck of winQueue) {
      winCheck.check(aliveCount, winners, aliveCount);
    }

    if (winners.groupAmt() > 0) finished = true;

    // Tower mode: deck exhausted
    if (!finished && !this.isWell && this.deck.length === 0) {
      let maxScore = -1;
      let winner = null;
      for (let player of this.players) {
        if (this.scores[player.id] > maxScore) {
          maxScore = this.scores[player.id];
          winner = player;
        }
      }
      if (winner) winners.addPlayer(winner, winner.name);
      finished = true;
    }

    // Well mode: someone emptied their stack
    if (!finished && this.isWell) {
      for (let player of this.players) {
        if (player.cardStack && player.cardStack.length === 0) {
          winners.addPlayer(player, player.name);
          finished = true;
        }
      }
    }

    winners.determinePlayers();
    return [finished, winners];
  }
}
