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

module.exports = class CountFalseInfoInfo extends Information {
  constructor(creator, game) {
    super("Count False Info Info", creator, game);

    var gameInfo = this.game.infoLog;
    //this.game.queueAlert(`Lenth Game ${gameInfo.length}`);
    let falseCount = 0;
    for (let info of gameInfo) {
      if (info.isFalse() == true) {
        falseCount = falseCount + 1;
      }
    }
    this.mainInfo = falseCount;
  }

  getInfoRaw() {
    return this.mainInfo;
  }

  getInfoFormated() {
    return `You Learn that ${this.mainInfo} players created False Infomation last night.`;
  }

  isTrue() {
    var gameInfo = this.game.infoLog;
    let falseCount = 0;
    for (let info of gameInfo) {
      if (info.isFalse()) {
        falseCount = falseCount + 1;
      }
    }
    if (this.mainInfo == falseCount) {
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
    if (this.mainInfo == this.game.infoLog.length) {
      return true;
    } else {
      return false;
    }
  }

  makeTrue() {
    var gameInfo = this.game.infoLog;
    let falseCount = 0;
    for (let info of gameInfo) {
      if (info.isFalse()) {
        falseCount = falseCount + 1;
      }
    }
    this.mainInfo = falseCount;
  }
  makeFalse() {
    this.makeTrue();
    if (this.mainInfo == 0) {
      this.mainInfo = this.mainInfo + Random.randInt(1, 2);
    } else {
      this.mainInfo = 0;
    }
  }
  makeFavorable() {
    this.mainInfo = 0;
  }
  makeUnfavorable() {
    this.mainInfo = this.game.infoLog.length;
  }
};
