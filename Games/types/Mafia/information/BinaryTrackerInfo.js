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
    let visits = this.getVisitsAppearance(this.target);
    if (visits.length > 0) {
      this.mainInfo = "visited somebody";
    } else {
      this.mainInfo = "did not visit anybody";
    }
  }

  getInfoRaw() {
    super.getInfoRaw();
    return this.mainInfo;
  }

  getInfoFormated() {
    super.getInfoRaw();
    return `You followed ${this.target.name}'s tracks... they ${this.mainInfo} during the night.`;
  }

  isTrue() {
    let visits = this.getVisits(this.target);
    let temp;
    if (visits.length > 0) {
      temp = "visited somebody";
    } else {
      temp = "did not visit anybody";
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
    if (this.mainInfo == "did not visit anybody") {
      return true;
    } else {
      return;
    }
  }
  isUnfavorable() {
    let badVisits = this.getKillVictims();

    if (badVisits.length <= 0 && this.mainInfo == "did not visit anybody") {
      return true;
    } else if (this.mainInfo == "visited somebody") {
      return true;
    }
    return false;
  }

  makeTrue() {
    let visits = this.getVisits(this.target);
    if (visits.length > 0) {
      this.mainInfo = "visited somebody";
    } else {
      this.mainInfo = "did not visit anybody";
    }
  }
  makeFalse() {
    let visits = this.getVisits(this.target);
    if (visits.length > 0) {
      this.mainInfo = "did not visit anybody";
    } else {
      this.mainInfo = "visited somebody";
    }
  }
  makeFavorable() {
    this.mainInfo = "did not visit anybody";
  }
  makeUnfavorable() {
    let badVisits = this.getKillVictims();
    badVisits = badVisits.filter((p) => p != this.target);
    if (badVisits.length <= 0) {
      this.mainInfo = "did not visit anybody";
    } else {
      this.mainInfo = "visited somebody";
    }
  }
};
