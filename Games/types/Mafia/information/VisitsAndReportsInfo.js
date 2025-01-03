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

module.exports = class VisitsAndReportsInfo extends Information {
  constructor(creator, game, targetA, targetB) {
    super("Visits And Reports Info", creator, game);
    if (targetA == null) {
      this.randomTarget = true;
      targetA = Random.randArrayVal(this.game.alivePlayers());
    }
    this.targetA = targetA;
    if (targetB == null) {
      this.randomTarget = true;
      targetB = Random.randArrayVal(this.game.alivePlayers());
    }
    this.targetB = targetB;

    let count = 0;
    if (
      this.getVisitsAppearance(this.targetB).length > 0 ||
      this.getReports(this.targetB).length > 0
    ) {
      count++;
    }
    if (
      this.getVisitsAppearance(this.targetA).length > 0 ||
      this.getReports(this.targetA).length > 0
    )
      this.mainInfo = count;
  }

  getInfoRaw() {
    super.getInfoRaw();
    return this.mainInfo;
  }

  getInfoFormated() {
    super.getInfoRaw();
    return `You learn that of ${this.targetA.name} and ${this.targetB.name}, ${this.mainInfo} of them received reports or visited another player.`;
  }

  isTrue() {
    let count = 0;
    if (
      this.getVisitsAppearance(this.targetB).length > 0 ||
      this.getReports(this.targetB).length > 0
    ) {
      count++;
    }
    if (
      this.getVisitsAppearance(this.targetA).length > 0 ||
      this.getReports(this.targetA).length > 0
    )
      if (this.mainInfo.length != count) {
        return false;
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
    if (this.mainInfo.length == 2) {
      return true;
    } else {
      return false;
    }
  }

  makeTrue() {
    let count = 0;
    if (
      this.getVisits(this.targetB).length > 0 ||
      this.getReports(this.targetB).length > 0
    ) {
      count++;
    }
    if (
      this.getVisits(this.targetA).length > 0 ||
      this.getReports(this.targetA).length > 0
    )
      this.mainInfo = count;
  }
  makeFalse() {
    this.makeTrue();

    if (this.mainInfo > 0) {
      this.mainInfo = 0;
    } else {
      this.mainInfo = 1;
    }
  }
  makeFavorable() {
    this.mainInfo = 0;
  }
  makeUnfavorable() {
    this.mainInfo = 2;
  }
};
