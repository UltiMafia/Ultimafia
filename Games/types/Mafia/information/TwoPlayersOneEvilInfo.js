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

module.exports = class TwoPlayersOneEvilInfo extends Information {
  constructor(creator, game, target) {
    super("Two Players One Evil Info", creator, game);

    this.target = target;
    let alive;
    if (this.target == null) {
      alive = this.game.alivePlayers().filter((p) => p);
    } else {
      alive = this.game.alivePlayers().filter((p) => p != this.target);
    }
    var evilPlayers = alive.filter((p) => this.isAppearanceEvil(p));

    if (evilPlayers.length <= 0) {
      this.mainInfo = "No Evil Players Exist";
      return;
    }

    var evilTarget = Random.randArrayVal(evilPlayers);
    alive = alive.filter((p) => p != evilTarget);
    alive = Random.randomizeArray(alive);
    let targets = [];
    targets.push(alive[0]);
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
    return `You Learn that at Least One of ${this.mainInfo[0].name}, or ${this.mainInfo[1].name} is Evil.`;
  }

  isTrue() {
    let alive;
    if (this.target == null) {
      alive = this.game.alivePlayers().filter((p) => p);
    } else {
      let alive = this.game.alivePlayers().filter((p) => p != this.target);
    }
    var goodPlayers = alive.filter((p) => this.isEvil(p));

    if (goodPlayers.length <= 0 && this.mainInfo == "No Evil Players Exist") {
      return true;
    } else if (
      goodPlayers.length <= 0 &&
      this.mainInfo != "No Evil Players Exist"
    ) {
      return false;
    }
    let containsEvil = false;
    for (let player of this.mainInfo) {
      if (this.isEvil(player)) {
        containsEvil = true;
      }
    }

    if (containsEvil) {
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
      let alive = this.game.alivePlayers().filter((p) => p != this.target);
    }
    var goodPlayers = alive.filter((p) => this.isEvil(p));

    if (goodPlayers.length <= 0) {
      this.mainInfo = "No Evil Players Exist";
      return;
    }

    var evilTarget = Random.randArrayVal(evilPlayers);
    alive = alive.filter((p) => p != evilTarget);
    alive = Random.randomizeArray(alive);
    let targets = [];
    targets.push(alive[0]);
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
    var goodPlayers = alive.filter((p) => !this.isEvil(p));

    if (goodPlayers.length <= 2) {
      this.mainInfo = "No Evil Players Exist";
      return;
    }

    //var evilTarget = Random.randArrayVal(evilPlayers);
    alive = evilPlayers;
    alive = Random.randomizeArray(alive);
    let targets = [];
    targets.push(alive[0]);
    targets.push(alive[1]);
    targets = Random.randomizeArray(targets);

    this.mainInfo = targets;
  }
  makeFavorable() {}
  makeUnfavorable() {}
};
