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
  constructor(creator, game, target, limtMafia, forceCount) {
    super("Watcher Info", creator, game);
    if (target == null) {
      this.randomTarget = true;
      target = Random.randArrayVal(this.game.alivePlayers());
    }
    if (limtMafia == null || limtMafia == false) {
      this.limtMafia = null;
    } else {
      this.limtMafia = true;
    }
    if (forceCount == null || forceCount == false) {
      this.forceCount = false;
    } else {
      this.forceCount = true;
    }
    this.target = target;

    let visitors;
    if (forceCount) {
      visitors = this.getVisitors(this.target);
    } else {
      visitors = this.getVisitorsAppearance(this.target);
    }
    let MafiaKill = this.getVisitors(this.target, "mafia");

    if (
      MafiaKill &&
      MafiaKill.length > 1 &&
      this.limtMafia == true &&
      this.forceCount == false
    ) {
      for (let x = 1; x < MafiaKill.length; x++) {
        visitors.splice(visitors.indexOf(MafiaKill[x]), 1);
      }
    }

  if(visitors.includes(this.creator)){
    while(visitors.includes(this.creator)){
    visitors.splice(visitors.indexOf(this.creator), 1);
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
    visitorNames = Random.randomizeArray(visitorNames);
    if (visitorNames.length == 0) visitorNames.push("no one");

    if (this.target == this.creator) {
      return `You learn that You were visited by ${visitorNames.join(
        ", "
      )} during the night.`;
    }

    return `You learn that ${
      this.target.name
    } was visited by ${visitorNames.join(", ")} during the night.`;

    //return `You Learn that your Target is ${this.mainInfo}`
  }

  isTrue() {
    let visitors = this.getVisitors(this.target);
    if(visitors.includes(this.creator)){
    while(visitors.includes(this.creator)){
    visitors.splice(visitors.indexOf(this.creator), 1);
    }
  }
    if (this.mainInfo.length != visitors.length) {
      return false;
    }
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
    let badVisits = this.getKillVictims();

    badVisits = badVisits.filter((p) => p == this.target);
    if (this.mainInfo.length <= 0) {
      return true;
    } else if (this.forceCount) {
      return true;
    } else {
      return false;
    }
  }
  isUnfavorable() {
    let badVisits = this.getKillVictims();

    badVisits = badVisits.filter((p) => p == this.target);
    if (this.mainInfo.length <= 0) {
      return false;
    } else if (this.forceCount) {
      return true;
    } else {
      return true;
    }
  }

  makeTrue() {
    let visitors = this.getVisitors(this.target);
    if(visitors.includes(this.creator)){
    while(visitors.includes(this.creator)){
    visitors.splice(visitors.indexOf(this.creator), 1);
    }
  }
    this.mainInfo = visitors;
  }
  makeFalse() {
    let visitors = this.getVisitors(this.target);
    if(visitors.includes(this.creator)){
    while(visitors.includes(this.creator)){
    visitors.splice(visitors.indexOf(this.creator), 1);
    }
  }
    if (visitors.length > 0 && this.forceCount == false) {
      this.mainInfo = [];
    } else {
      let possibleVisitors = this.game
        .alivePlayers()
        .filter(
          (p) => p != this.creator && p != this.target && !visitors.includes(p)
        );
      let fakeInfo = [];
      if (this.forceCount) {
        Random.randomizeArray(possibleVisitors);
        let doubles = false;
        if (possibleVisitors.length < visitors.length) {
          doubles = true;
        }
        for (let x = 0; x < visitors.length; x++) {
          if (doubles) {
            fakeInfo.push(Random.randArrayVal(possibleVisitors));
          } else {
            fakeInfo.push(possibleVisitors[x]);
          }
        }
      } else {
        fakeInfo.push(Random.randArrayVal(possibleVisitors));
      }
      this.mainInfo = fakeInfo;
    }
  }
  makeFavorable() {
    let visitors = this.getVisitors(this.target);
    if(visitors.includes(this.creator)){
    while(visitors.includes(this.creator)){
    visitors.splice(visitors.indexOf(this.creator), 1);
    }
  }
    let badVisits = this.getKillVictims();
    let possibleExtraVisitors = this.game
      .alivePlayers()
      .filter(
        (p) => p != this.creator && p != this.target && !visitors.includes(p)
      );
    badVisits = badVisits.filter((p) => p == this.target);
    let fakeInfo = [];
    if (!this.forceCount) {
      this.mainInfo = [];
    } else if (this.forceCount) {
      this.mainInfo = visitors;
      return;
    } else {
      this.mainInfo = [];
      return;
    }
  }
  makeUnfavorable() {
    let visitors = this.getVisitors(this.target);
    if(visitors.includes(this.creator)){
    while(visitors.includes(this.creator)){
    visitors.splice(visitors.indexOf(this.creator), 1);
    }
  }
    let badVisits = this.getKillVictims();
    let possibleVisitors = this.game
      .alivePlayers()
      .filter((p) => p != this.creator && p != this.target);
    badVisits = badVisits.filter((p) => p == this.target);
    if (this.forceCount || visitors.length > 0) {
      this.mainInfo = visitors;
    } else {
      this.mainInfo = [Random.randArrayVal(possibleVisitors)];
    }
  }
};
