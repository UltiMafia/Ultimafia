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

module.exports = class TrackerInfo extends Information {
  constructor(creator, game, target) {
    super("Tracker Info", creator, game);
    if (target == null) {
      this.randomTarget = true;
      target = Random.randArrayVal(this.game.alivePlayers());
    }
    this.target = target;
    let visits = this.getVisits(this.target);
    this.mainInfo = visits;
  }

  getInfoRaw() {
    super.getInfoRaw();
    return this.mainInfo;
  }

  getInfoFormated() {
    super.getInfoRaw();

    let visitNames = this.mainInfo.map((p) => p.name);
    visitNames = Random.randomizeArray(visitNames);
    if (visitNames.length == 0) visitNames.push("no one");

    return `You learn that ${this.target.name} visited ${visitNames.join(
                ", "
              )} during the night.`;

    //return `You Learn that your Target is ${this.mainInfo}`
  }

  isTrue() {
   let visits = this.getVisits(this.target);
    for(let player of this.mainInfo){
      if(!visits.includes(player)){
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

    if(badVisits.length <= 0 && this.mainInfo <= 0){
      return true;
    }
    for(let player of this.mainInfo){
      if(badVisits.includes(player)){
        return true;
      }
    }
    return false;
  }

  makeTrue() {
    let visits = this.getVisits(this.target);
    this.mainInfo = visits;
  }
  makeFalse() {
    let visits = this.getVisits(this.target);
    if(visits.length > 0){
      this.mainInfo = [];
    }
    else{
      let possibleVisits = this.game.alivePlayers().filter((p) => p != this.target && !(visits.includes(p)));
      this.mainInfo = [Random.randArrayVal(possibleVisits)];
    }
  }
  makeFavorable() {
    this.mainInfo = [];
  }
  makeUnfavorable() {
     let badVisits = this.getKillVictims();
    badVists = badVisits.filter((p) => p != this.target);
    if(badVisits.length <= 0){
      this.mainInfo = [];
    }
    else{
      this.mainInfo = [Random.randArrayVal(badVisits)];
    }
  }
};
