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

module.exports = class AlignmentInfo extends Information {
  constructor(creator, game, targetA, targetB) {
    super("Alignment Info", creator, game);
    if (target == null) {
      this.randomTarget = true;
      target = Random.randArrayVal(this.game.alivePlayers());
    }
    this.targetA = targetA;
    this.targetB = targetB;
    let alignmentA = this.getAppearanceAlignment(targetA);
    let alignmentB = this.getAppearanceAlignment(targetB);
    if ((alignmentA == alignmentB)) {
      this.mainInfo = "the Same";
    } else {
      this.mainInfo = "Diffrent";
    }
  }

  getInfoRaw() {
    super.getInfoRaw();
    return this.mainInfo;
  }

  getInfoFormated() {
    super.getInfoRaw();
    return `You Learn that your ${this.targetA.name} and ${this.targetB.name} have ${this.mainInfo} Alignments.`;
    //return `You Learn that your Target's Alignment is ${this.mainInfo}`
  }

  isTrue() {
    let alignmentA = this.getAlignment(targetA);
    let alignmentB = this.getAlignment(targetB);
    if ((alignmentA == alignmentB)) {
      if(this.mainInfo == "the Same"){
        return true;
      }
    } else {
      if(this.mainInfo == "Diffrent"){
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
    if (this.mainInfo == "the Same") {
      return true;
    } else {
      return false;
    }
  }
  isUnfavorable() {
    if ((this.mainInfo == "Diffrent") {
      return false;
    } else {
      return true;
    }
  }

  makeTrue() {
    let alignmentA = this.getAlignment(targetA);
    let alignmentB = this.getAlignment(targetB);
    if ((alignmentA == alignmentB)) {
      this.mainInfo = "the Same";
    } else {
      this.mainInfo = "Diffrent";
    }
  }
  makeFalse() {
    let alignmentA = this.getAlignment(targetA);
    let alignmentB = this.getAlignment(targetB);
    if ((alignmentA == alignmentB)) {
      this.mainInfo = "Diffrent";
    } else {
      this.mainInfo = "the Same";
    }
  }
  makeFavorable() {
    this.mainInfo = "the Same";
  }
  makeUnfavorable() {
     this.mainInfo = "Diffrent";
  }
};
