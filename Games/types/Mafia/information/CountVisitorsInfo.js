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

module.exports = class CountVisitorsInfo extends Information {
  constructor(creator, game, target, limtMafia) {
    super("Count Visitors Info", creator, game);
    if (target == null) {
      this.randomTarget = true;
      target = Random.randArrayVal(this.game.alivePlayers());
    }
    if (limtMafia == null || limtMafia == false) {
      this.limtMafia = null;
    } else {
      this.limtMafia = true;
    }
    this.target = target;

    let visitors;
    visitors = this.getVisitorsAppearance(this.target);
    let MafiaKill = this.getVisitors(this.target, "mafia");

    if (MafiaKill && MafiaKill.length > 1 && this.limtMafia == true) {
      for (let x = 1; x < MafiaKill.length; x++) {
        visitors.splice(visitors.indexOf(MafiaKill[x]), 1);
      }
    }
    this.mainInfo = visitors.length;
  }

  getInfoRaw() {
    super.getInfoRaw();
    return this.mainInfo;
  }

  getInfoFormated() {
    super.getInfoRaw();

    if (this.target == this.creator) {
      return `${this.mainInfo} people came to visit you during the night.`;
    }

    return `You learn that ${this.target.name} was visited by ${this.mainInfo} people during the night.`;

    //return `You Learn that your Target is ${this.mainInfo}`
  }

  isTrue() {
    let visitors = this.getVisitors(this.target);
    if (this.mainInfo != visitors.length) {
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
    if (this.mainInfo <= 0) {
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
    let visitors = this.getVisitors(this.target);
    this.mainInfo = visitors.length;
  }
  makeFalse() {
    let visitors = this.getVisitors(this.target);
    if (visitors.length <= 0) {
      this.mainInfo = 1;
    } else {
      this.mainInfo = this.mainInfo - 1;
    }
  }
  makeFavorable() {
    this.mainInfo = 0;
  }
  makeUnfavorable() {
    this.mainInfo = Random.randArrayVal([1, 2, 3]);
  }
};
