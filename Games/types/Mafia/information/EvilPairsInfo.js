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

module.exports = class EvilPairsInfo extends Information {
  constructor(creator, game) {
    super("Evil Pairs Info", creator, game);

    let alive = this.game.alivePlayers();
    var evilPlayers = alive.filter((p) => this.isAppearanceEvil(p));
    var evilPair = 0;
    var index;
    var rightIdx;
    var neighborAlignment;

    this.maxPairs = evilPlayers.length - 1;

    for (let x = 0; x < evilPlayers.length; x++) {
      index = alive.indexOf(evilPlayers[x]);
      rightIdx = (index + 1) % alive.length;

      if (this.isAppearanceEvil(alive[rightIdx])) {
        evilPair = evilPair + 1;
      }
    }
    this.mainInfo = evilPair;
  }

  getInfoRaw() {
    super.getInfoRaw();
    return this.mainInfo;
  }

  getInfoFormated() {
    super.getInfoRaw();
    return `You learn that there are ${this.mainInfo} pairs of Evildoers neighboring another Evildoer.`;
  }

  getInfoSpecial() {
    return `There are ${this.mainInfo} pairs of Evildoers neighboring another Evildoer.`;
  }

  isTrue() {
    let alive = this.game.alivePlayers();
    var evilPlayers = alive.filter((p) => this.isEvil(p));
    var evilPair = 0;
    var index;
    var rightIdx;
    var neighborAlignment;
    for (let x = 0; x < evilPlayers.length; x++) {
      index = alive.indexOf(evilPlayers[x]);
      rightIdx = (index + 1) % alive.length;

      if (this.isEvil(alive[rightIdx])) {
        evilPair = evilPair + 1;
      }
    }
    if (this.mainInfo == evilPair) {
      return true;
    } else {
      return false;
    }
  }
  isFalse() {
    if (this.isTrue()) {
      return false;
    } else {
      return true;
    }
  }
  isFavorable() {
    if (this.mainInfo == 0) {
      return true;
    } else {
      return false;
    }
  }
  isUnfavorable() {
    if (this.mainInfo == this.maxPairs) {
      return true;
    } else {
      return false;
    }
  }

  makeTrue() {
    let alive = this.game.alivePlayers();
    var evilPlayers = alive.filter((p) => this.isEvil(p));
    var evilPair = 0;
    var index;
    var rightIdx;
    var neighborAlignment;

    for (let x = 0; x < evilPlayers.length; x++) {
      index = alive.indexOf(evilPlayers[x]);
      rightIdx = (index + 1) % alive.length;

      if (this.isEvil(alive[rightIdx])) {
        evilPair = evilPair + 1;
      }
    }
    this.mainInfo = evilPair;
  }
  makeFalse() {
    this.makeTrue();
    if (this.mainInfo == 0 && this.maxPairs != 0) {
      this.mainInfo = this.maxPairs;
    } else if (this.mainInfo == this.maxPairs) {
      this.mainInfo = 0;
    } else {
      this.mainInfo = this.mainInfo + 1;
    }
  }
  makeFavorable() {
    this.mainInfo = 0;
  }
  makeUnfavorable() {
    this.mainInfo = this.maxPairs;
  }
};
