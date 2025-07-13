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

module.exports = class BinaryAlignmentInfo extends Information {
  constructor(creator, game, target) {
    super("Binary Alignment Info", creator, game);
    if (target == null) {
      this.randomTarget = true;
      target = Random.randArrayVal(this.game.alivePlayers());
    }
    this.target = target;
    if (!this.isAppearanceEvil(this.target)) {
      this.mainInfo = "Innocent";
    } else {
      this.mainInfo = "Guilty";
    }
  }

  getInfoRaw() {
    super.getInfoRaw();
    return this.mainInfo;
  }

  getInfoFormated() {
    super.getInfoRaw();

    return `Your investigation shows that ${this.target.name} is ${this.mainInfo}`;
  }
  getInfoSpecial() {
    return `${this.target.name} is ${this.mainInfo}`;
  }

  isTrue() {
    if (!this.isEvil(this.target)) {
      if (this.mainInfo == "Innocent") {
        return true;
      }
    } else if (this.isEvil(this.target)) {
      if (this.mainInfo == "Guilty") {
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
    if (this.mainInfo != "Innocent") {
      return false;
    } else {
      return true;
    }
  }
  isUnfavorable() {
    if (this.mainInfo == "Innocent") {
      return false;
    } else {
      return true;
    }
  }

  makeTrue() {
    if (this.isEvil(this.target)) {
      this.mainInfo = "Guilty";
    } else {
      this.mainInfo = "Innocent";
    }
  }
  makeFalse() {
    if (this.isEvil(this.target)) {
      this.mainInfo = "Innocent";
    } else {
      this.mainInfo = "Guilty";
    }
  }
  makeFavorable() {
    this.mainInfo = "Innocent";
  }
  makeUnfavorable() {
    this.mainInfo = "Guilty";
  }
};
