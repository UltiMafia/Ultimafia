const Information = require("../Information");
const Random = require("../../../../lib/Random");
const {
  EVIL_FACTIONS,
  NOT_EVIL_FACTIONS,
  CULT_FACTIONS,
  MAFIA_FACTIONS,
  FACTION_LEARN_TEAM,
  FACTION_WIN_WITH_MAJORITY,
  FACTION_WITH_MEETING,
  FACTION_KILL,
} = require("../const/FactionList");

module.exports = class PlayerArrayInfo extends Information {
  constructor(creator, game, target) {
    super("Player Array Info", creator, game);
    if (target == null) {
      this.randomTarget = true;
      target = [];
    }
    if (!Array.isArray(target)) {
      target = [target];
    }
    this.target = target;
    this.mainInfo = this.target;
  }

  getInfoRaw() {
    super.getInfoRaw();
    return this.mainInfo;
  }

  getInfoFormated() {
    super.getInfoRaw();

    let playerNames = this.mainInfo.map((p) => p.name);
    playerNames = Random.randomizeArray(playerNames);
    if (playerNames.length == 0) playerNames.push("no one");

    return `You learn ${playerNames.join(", ")}`;

    //return `You Learn that your Target is ${this.mainInfo}`
  }

  isTrue() {
    let players = this.target;
    if (this.mainInfo.length != players.length) {
      return false;
    }
    for (let player of players) {
      if (!this.mainInfo.includes(player)) {
        return false;
      }
    }
    return true;
  }
  isFalse() {
    if (this.isTrue()) {
      return false;
    } else {
      return true;
    }
  }
  isFavorable() {
    if (this.mainInfo.length <= 0) {
      return true;
    } else {
      return false;
    }
  }
  isUnfavorable() {
    if (this.mainInfo.length <= 0) {
      return false;
    } else {
      return true;
    }
  }

  makeTrue() {
    this.mainInfo = this.target;
  }
  makeFalse() {
    let players = this.target;
    let possiblePlayers = this.game
      .alivePlayers()
      .filter((p) => p != this.creator && !(players.includes(p)));
    let fakeInfo = [];
    fakeInfo.push(Random.randArrayVal(possiblePlayers));
    this.mainInfo = fakeInfo;
  }
  makeFavorable() {
    this.mainInfo = [];
  }
  makeUnfavorable() {
    let players = this.target;
    let possiblePlayers = this.game
      .alivePlayers()
      .filter((p) => p != this.creator);
    this.mainInfo = [Random.randArrayVal(possiblePlayers)];
  }
};
