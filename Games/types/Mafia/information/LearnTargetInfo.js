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

module.exports = class LearnTargetInfo extends Information {
  constructor(creator, game, target) {
    super("Learn Target Info", creator, game);
    if (target == null) {
      this.randomTarget = true;
      target = Random.randArrayVal(this.game.alivePlayers());
    }
    this.target = target;
    this.mainInfo = this.target;
    
  }

  getInfoRaw() {
    super.getInfoRaw();
    return this.mainInfo;
  }

  getInfoFormated() {
    super.getInfoRaw();

    return `You Learn ${this.mainInfo}`;

    //return `You Learn that your Target is ${this.mainInfo}`
  }

  isTrue() {
    if (this.mainInfo == this.target) {
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
  if(!this.isEvil(this.mainInfo)){
    return false;
  }
  return true;
  }
  isUnfavorable() {
    if(this.isEvil(this.mainInfo)){
    return true;
  }
  return false;
  }

  makeTrue() {
      this.mainInfo = this.target;
  }
  makeFalse() {
    let players = this.game.alivePlayers().filter((p) => p != this.target && p != this.creator)
     this.mainInfo = Random.randArrayVal(players);
  }
  makeFavorable() {
    let players = this.game.alivePlayers().filter((p) => !this.isEvil(p));
     this.mainInfo = Random.randArrayVal(players);
  }
  makeUnfavorable() {
    let players = this.game.alivePlayers().filter((p) => this.isEvil(p));
     this.mainInfo = Random.randArrayVal(players);
  }
};
