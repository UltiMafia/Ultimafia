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

module.exports = class BinaryTrackerInfo extends Information {
  constructor(creator, game, target) {
    super("Binary Tracker Info", creator, game);
    if (target == null) {
      this.randomTarget = true;
      target = Random.randArrayVal(this.game.alivePlayers());
    }
    this.target = target;
    let visitors = this.getVisitorsAppearance(this.target);
    if (visitors.length > 0) {
      this.mainInfo = "visited by somebody";
    } else {
      this.mainInfo = "not visited by anybody";
    }
  }

  getInfoRaw() {
    super.getInfoRaw();
    return this.mainInfo;
  }

  getInfoFormated() {
    super.getInfoRaw();
    return `You watched ${this.target.name}... they were ${this.mainInfo}.`;
    //return `You Learn that your Target is ${this.mainInfo}`
  }

  isTrue() {
    let visitors = this.getVisitors(this.target);
    let temp;
    if (visitors.length > 0) {
      temp = "visited by somebody";
    } else {
      temp = "not visited by anybody";
    }
    if (temp == this.mainInfo) {
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
    if (this.mainInfo == "not visited by anybody") {
      return true;
    } else {
      return false;
    }
  }
  isUnfavorable() {
    if (this.mainInfo == "visited by somebody") {
      return true;
    } else {
      return false;
    }
  }

  makeTrue() {
    let visitors = this.getVisitors(this.target);
    if (visitors.length > 0) {
      this.mainInfo = "visited by somebody";
    } else {
      this.mainInfo = "not visited by anybody";
    }
  }
  makeFalse() {
    let visitors = this.getVisitors(this.target);
    if (visitors.length > 0) {
      this.mainInfo = "not visited by anybody";
    } else {
      this.mainInfo = "visited by somebody";
    }
  }
  makeFavorable() {
    this.mainInfo = "not visited by anybody";
  }
  makeUnfavorable() {
    this.mainInfo = "visited by somebody";
  }
};
