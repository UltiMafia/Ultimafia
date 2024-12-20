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

module.exports = class WatcherInfo extends Information {
  constructor(creator, game, target, limtMafia) {
    super("Watcher Info", creator, game);
    if (target == null) {
      this.randomTarget = true;
      target = Random.randArrayVal(this.game.alivePlayers());
    }
    if(limtMafia == null || limtMafia == false){
      this.limtMafia = null;
    }
    else{
      this.limtMafia = true;
    }
    this.target = target;

    
    let visitors = this.getVisitors(this.target);
    let MafiaKill = this.getVisitors(this.target, "mafia");

              if (MafiaKill && MafiaKill.length > 1 && this.limtMafia == true) {
                for (let x = 1; x < MafiaKill.length; x++) {
                  visitors.splice(visitors.indexOf(MafiaKill[x]), 1);
                }
              }
    this.mainInfo = visitors;
  }

  getInfoRaw() {
    super.getInfoRaw();
    return this.mainInfo;
  }

  getInfoFormated() {
    super.getInfoRaw();

    let visitorNames = this.mainInfo.map((p) => p.name);
    visitorNames = Random.randomizeArray(visitNames);
    if (visitorNames.length == 0) visitNames.push("no one");

    return `You learn that ${this.target.name} was visited by ${visitorNames.join(
      ", "
    )} during the night.`;

    //return `You Learn that your Target is ${this.mainInfo}`
  }

  isTrue() {
    let visitors = this.getVisitors(this.target);
    for (let player of visitors) {
      if (!this.mainInfo.includes(player)) {
        return false;
      }
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
    if (this.mainInfo.length > 0) {
      return false;
    } else {
      return true;
    }
  }
  isUnfavorable() {
    let badVisits = this.getKillVictims();

    if (badVisits.length <= 0 && this.mainInfo.length <= 0) {
      return true;
    }
    for (let player of this.mainInfo) {
      if (badVisits.includes(player)) {
        return true;
      }
    }
    return false;
  }

  makeTrue() {
    let visitors = this.getVisitors(this.target);
    this.mainInfo = visitors;
  }
  makeFalse() {
    let visitors = this.getVisitors(this.target);
    if (visitors.length > 0) {
      this.mainInfo = [];
    } else {
      let possibleVisitors = this.game
        .alivePlayers()
        .filter((p) => p != this.creator && p != this.target && !visitors.includes(p));
      this.mainInfo = [Random.randArrayVal(possibleVisitors)];
    }
  }
  makeFavorable() {
    let badVisits = this.getKillVictims();
    let possibleVisitors = this.game
        .alivePlayers()
        .filter((p) => p != this.creator && p != this.target && !visitors.includes(p));
    badVisits = badVisits.filter((p) => p == this.target);
    if (badVisits.length <= 0) {
      this.mainInfo = [];
    } else {
      this.mainInfo = [Random.randArrayVal(possibleVisitors)];
    }
  }
  makeUnfavorable() {
    let badVisits = this.getKillVictims();
    let possibleVisitors = this.game
        .alivePlayers()
        .filter((p) => p != this.creator && p != this.target);
    badVisits = badVisits.filter((p) => p == this.target);
    if (badVisits.length <= 0) {
      this.mainInfo = [];
    } else {
      this.mainInfo = [Random.randArrayVal(possibleVisitors)];
    }
  }
};
