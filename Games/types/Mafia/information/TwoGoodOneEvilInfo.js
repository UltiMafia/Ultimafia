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

module.exports = class TwoGoodOneEvilInfo extends Information {
  constructor(creator, game, target) {
    super("Two Good One Evil Info", creator, game);

    this.target = target;
    let alive;
    if (this.target == null) {
      alive = this.game.alivePlayers().filter((p) => p != this.target);
    } else {
      alive = this.game.alivePlayers().filter((p) => p);
    }
    var evilPlayers = alive.filter((p) => this.isAppearanceEvil(p));
    var goodPlayers = alive.filter((p) => !this.isAppearanceEvil(p));

    if (evilPlayers.length <= 0 || goodPlayers.length <= 1 ) {
      alive = this.game.players.filter((p) => p != this.target);
      evilPlayers = alive.filter((p) => this.isAppearanceEvil(p));
      goodPlayers = alive.filter((p) => !this.isAppearanceEvil(p));
      if (evilPlayers.length <= 0){
      this.mainInfo = "No Evil Players Exist";
      return;
      }
      if(goodPlayers.length <= 0){
      this.mainInfo = "Not Enough Good Players Exist";
      return;
      }
    }
    

    var evilTarget = Random.randArrayVal(evilPlayers);
    goodPlayers = goodPlayers.filter((p) => p != evilTarget);
    goodPlayers = Random.randomizeArray(goodPlayers);
    let targets = [];
    targets.push(goodPlayers[0]);
    targets.push(goodPlayers[1]);
    targets.push(evilTarget);
    targets = Random.randomizeArray(targets);

    this.mainInfo = targets;
  }

  getInfoRaw() {
    super.getInfoRaw();
    return this.mainInfo;
  }

  getInfoFormated() {
    super.getInfoRaw();
    if (this.mainInfo == "No Evil Players Exist") {
      return `You Learn that ${this.mainInfo}`;
    }
    else if(this.mainInfo == "Not Enough Good Players Exist"){
      return `You Learn that ${this.mainInfo}`;
    }
    return `While conducting your symphony, you hear a sour note... exactly one of ${this.mainInfo[0].name}, ${this.mainInfo[1].name}, or ${this.mainInfo[2].name} is Evil.`;
  }

  isTrue() {
    let alive;
    if (this.target == null) {
      alive = this.game.players.filter((p) => p);
    } else {
      alive = this.game.players.filter((p) => p != this.target);
    }
    var evilPlayers = alive.filter((p) => this.isEvil(p));
    var goodPlayers = alive.filter((p) => !this.isEvil(p));

    if (evilPlayers.length <= 0 && this.mainInfo == "No Evil Players Exist") {
      return true;
    } else if (
      evilPlayers.length <= 0 &&
      this.mainInfo != "No Evil Players Exist"
    ) {
      return false;
    }
    if (goodPlayers.length <= 1 && this.mainInfo == "Not Enough Good Players Exist") {
      return true;
    } else if (
      goodPlayers.length <= 1 &&
      this.mainInfo != "Not Enough Good Players Exist"
    ) {
      return false;
    }
    
    let containsEvil = false;
    let goodCount = 0;
    for (let player of this.mainInfo) {
      if (this.isEvil(player)) {
        containsEvil = true;
      }
      else{
        goodCount++;
      }
    }

    if (containsEvil && goodCount == 2) {
      return true;
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
    return true;
  }
  isUnfavorable() {
    return true;
  }

  makeTrue() {
    let alive;
    if (this.target == null) {
      alive = this.game.alivePlayers().filter((p) => p);
    } else {
      alive = this.game.alivePlayers().filter((p) => p != this.target);
    }
    var evilPlayers = alive.filter((p) => this.isEvil(p));
    var goodPlayers = alive.filter((p) => !this.isEvil(p));

      if (evilPlayers.length <= 0 || goodPlayers.length <= 1 ) {
      alive = this.game.players.filter((p) => p != this.target);
      evilPlayers = alive.filter((p) => this.isEvil(p));
      goodPlayers = alive.filter((p) => !this.isEvil(p));
      if (evilPlayers.length <= 0){
      this.mainInfo = "No Evil Players Exist";
      return;
      }
      if(goodPlayers.length <= 0){
      this.mainInfo = "Not Enough Good Players Exist";
      return;
      }

    var evilTarget = Random.randArrayVal(evilPlayers);
    goodPlayers = goodPlayers.filter((p) => p != evilTarget);
    goodPlayers = Random.randomizeArray(goodPlayers);
    let targets = [];
    targets.push(goodPlayers[0]);
    targets.push(goodPlayers[1]);
    targets.push(evilTarget);
    targets = Random.randomizeArray(targets);

    this.mainInfo = targets;
      
    }
    

    var evilTarget = Random.randArrayVal(evilPlayers);
    goodPlayers = goodPlayers.filter((p) => p != evilTarget);
    goodPlayers = Random.randomizeArray(goodPlayers);
    let targets = [];
    targets.push(goodPlayers[0]);
    targets.push(goodPlayers[1]);
    targets.push(evilTarget);
    targets = Random.randomizeArray(targets);

    this.mainInfo = targets;
  }
  makeFalse() {
    let alive;
    if (this.target == null) {
      alive = this.game.alivePlayers().filter((p) => p);
    } else {
      alive = this.game.alivePlayers().filter((p) => p != this.target);
    }
    var evilPlayers = alive.filter((p) => !this.isEvil(p));

    if (evilPlayers.length <= 2) {
      this.mainInfo = "No Evil Players Exist";
      return;
    }

    //var evilTarget = Random.randArrayVal(evilPlayers);
    alive = evilPlayers;
    alive = Random.randomizeArray(alive);
    let targets = [];
    targets.push(alive[0]);
    targets.push(alive[1]);
    targets.push(alive[2]);
    targets = Random.randomizeArray(targets);

    this.mainInfo = targets;
  }
  makeFavorable() {}
  makeUnfavorable() {}
};
