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

module.exports = class CompareAlignmentInfo extends Information {
  constructor(creator, game, targetA, targetB) {
    super("Compare Alignment Info", creator, game);
    if (targetA == null) {
      this.randomTarget = true;
      targetA = Random.randArrayVal(this.game.alivePlayers());
    }
    if (targetB == null) {
      this.randomTarget = true;
      targetB = Random.randArrayVal(
        this.game.alivePlayers().filter((p) => p != targetA)
      );
    }
    this.targetA = targetA;
    this.targetB = targetB;
    let alignmentA = this.getAppearanceAlignment(this.targetA);
    let alignmentB = this.getAppearanceAlignment(this.targetB);
    if (alignmentA == alignmentB) {
      this.mainInfo = "match in alignment";
    } else {
      this.mainInfo = "differ in alignment";
    }
  }

  getInfoRaw() {
    super.getInfoRaw();
    return this.mainInfo;
  }

  getInfoFormated() {
    super.getInfoRaw();
    return `You weigh the souls of ${this.targetA.name} and ${this.targetB.name}... they ${this.mainInfo}.`;
  }
  getInfoSpecial() {
    return `${this.targetA.name} and ${this.targetB.name} ${this.mainInfo}.`;
  }

  isTrue() {
    let alignmentA = this.getAlignment(this.targetA);
    let alignmentB = this.getAlignment(this.targetB);
    if (alignmentA == alignmentB) {
      if (this.mainInfo == "match in alignment") {
        return true;
      }
    } else {
      if (this.mainInfo == "differ in alignment") {
        return true;
      }
    }
    return false;
  }
  isFalse() {
    if (this.isTrue()) {
      return false;
    } else {
      return true;
    }
  }
  isFavorable() {
    if (this.mainInfo == "match in alignment") {
      return true;
    } else {
      return false;
    }
  }
  isUnfavorable() {
    if (this.mainInfo == "differ in alignment") {
      return true;
    } else {
      return false;
    }
  }

  makeTrue() {
    let alignmentA = this.getAlignment(this.targetA);
    let alignmentB = this.getAlignment(this.targetB);
    if (alignmentA == alignmentB) {
      this.mainInfo = "match in alignment";
    } else {
      this.mainInfo = "differ in alignment";
    }
  }
  makeFalse() {
    let alignmentA = this.getAlignment(this.targetA);
    let alignmentB = this.getAlignment(this.targetB);
    if (alignmentA == alignmentB) {
      this.mainInfo = "differ in alignment";
    } else {
      this.mainInfo = "match in alignment";
    }
  }
  makeFavorable() {
    this.mainInfo = "match in alignment";
  }
  makeUnfavorable() {
    this.mainInfo = "differ in alignment";
  }
};
