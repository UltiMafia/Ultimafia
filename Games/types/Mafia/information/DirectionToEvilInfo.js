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

module.exports = class DirectionToEvilInfo extends Information {
  constructor(creator, game, target) {
    super("Direction To Evil Info", creator, game);
    if (target == null) {
      this.randomTarget = true;
      target = Random.randArrayVal(this.game.alivePlayers());
    }
    this.target = target;

    let alive = this.game.alivePlayers();
    var evilPlayers = alive.filter((p) => this.isAppearanceEvil(p));
    let info = "";
    if (evilPlayers.length <= 0) {
      info = "Not Applicable";
    }

    var evilTarget = Random.randArrayVal(evilPlayers);
    var indexOfTarget = alive.indexOf(this.target);
    var rightIdx;
    var leftIdx;
    var leftAlign;
    var rightAlign;
    var distance = 0;
    var found = false;
    //let info = "";
    if (info != "Not Applicable") {
      for (let x = 0; x < alive.length; x++) {
        leftIdx = (indexOfTarget - distance - 1 + alive.length) % alive.length;
        rightIdx = (indexOfTarget + distance + 1) % alive.length;

        if (this.isAppearanceEvil(alive[rightIdx])) {
          found = true;
          info = "Below";
          break;
        }
        if (this.isAppearanceEvil(alive[leftIdx])) {
          found = true;
          info = "Above";
          break;
        }
        if (!found) {
          distance = x;
        }
      }
    }
    this.mainInfo = info;
  }

  getInfoRaw() {
    super.getInfoRaw();
    return this.mainInfo;
  }

  getInfoFormated() {
    super.getInfoRaw();
    if (this.target == this.creator) {
      return `You learn that the closest Evil Player to you is ${this.mainInfo} you on the Player List`;
    }
    if (this.randomTarget == true) {
      return `You learn that the closest Evil Player to ${this.target.name} is ${this.mainInfo} them on the Player List`;
    }
    return `You learn that the closest Evil Player to your Target is ${this.mainInfo} them on the Player List`;
  }
  getInfoSpecial() {
    if (this.target == this.creator) {
      return `The closest Evil Player to you is ${this.mainInfo} you on the Player List`;
    }
    return `The closest Evil Player to ${this.target.name} is ${this.mainInfo} them on the Player List`;
  }

  isTrue() {
    let alive = this.game.alivePlayers();
    var evilPlayers = alive.filter((p) => this.isEvil(p));
    let info = "";
    if (evilPlayers.length <= 0) {
      info = "Not Applicable";
    }

    var evilTarget = Random.randArrayVal(evilPlayers);
    var indexOfTarget = alive.indexOf(this.target);
    var rightIdx;
    var leftIdx;
    var leftAlign;
    var rightAlign;
    var distance = 0;
    var found = false;
    //let info = "";
    if (info != "Not Applicable") {
      for (let x = 0; x < alive.length; x++) {
        leftIdx = (indexOfTarget - distance - 1 + alive.length) % alive.length;
        rightIdx = (indexOfTarget + distance + 1) % alive.length;

        if (this.isEvil(alive[rightIdx])) {
          found = true;
          info = "Below";
          break;
        }
        if (this.isEvil(alive[leftIdx])) {
          found = true;
          info = "Above";
          break;
        }

        if (!found) {
          distance = x;
        }
      }
    }
    if (this.mainInfo == info) {
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
    return true;
  }
  isUnfavorable() {
    return true;
  }

  makeTrue() {
    let alive = this.game.alivePlayers();
    var evilPlayers = alive.filter((p) => this.isEvil(p));
    let info = "";
    if (evilPlayers.length <= 0) {
      info = "Not Applicable";
    }

    var evilTarget = Random.randArrayVal(evilPlayers);
    var indexOfTarget = alive.indexOf(this.target);
    var rightIdx;
    var leftIdx;
    var leftAlign;
    var rightAlign;
    var distance = 0;
    var found = false;
    //let info = "";
    if (info != "Not Applicable") {
      for (let x = 0; x < alive.length; x++) {
        leftIdx = (indexOfTarget - distance - 1 + alive.length) % alive.length;
        rightIdx = (indexOfTarget + distance + 1) % alive.length;

        if (this.isEvil(alive[rightIdx])) {
          found = true;
          info = "Below";
          break;
        }
        if (this.isEvil(alive[leftIdx])) {
          found = true;
          info = "Above";
          break;
        }
        if (!found) {
          distance = x;
        }
      }
    }
    this.mainInfo = info;
  }
  makeFalse() {
    this.makeTrue();
    if (this.mainInfo == "Above") {
      this.mainInfo = "Below";
    } else if (this.mainInfo == "Below") {
      this.mainInfo = "Above";
    } else {
      this.mainInfo = "Below";
    }
  }
  makeFavorable() {
    this.makeFalse();
  }
  makeUnfavorable() {
    this.makeTrue();
  }
};
