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

module.exports = class EvilPlayerInfo extends Information {
  constructor(creator, game, target) {
    super("Evil Player Info", creator, game);

    this.target = target;
    let alive;
    if (this.target == null) {
      alive = this.game.alivePlayers().filter((p) => p);
    } else {
      alive = this.game.alivePlayers().filter((p) => p != this.target);
    }
    var evilPlayers = alive.filter((p) => this.isAppearanceEvil(p));

    if (evilPlayers.length <= 0) {
      this.mainInfo = "no Evildoers exist.";
      return;
    }

    var evilTarget = Random.randArrayVal(evilPlayers);

    this.mainInfo = evilTarget;
  }

  getInfoRaw() {
    super.getInfoRaw();
    return this.mainInfo;
  }

  getInfoFormated() {
    super.getInfoRaw();
    if (this.mainInfo == "no Evildoers exist.") {
      return `You learn that ${this.mainInfo}`;
    }
    return `You learn that ${this.mainInfo.name} is Evil.`;
  }

  isTrue() {
    if (this.isEvil(this.mainInfo)) {
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

    if (evilPlayers.length <= 0) {
      this.mainInfo = "no Evildoers exist.";
      return;
    }

    var evilTarget = Random.randArrayVal(evilPlayers);

    this.mainInfo = evilTarget;
  }
  makeFalse() {
    let alive;
    if (this.target == null) {
      alive = this.game.alivePlayers().filter((p) => p);
    } else {
      alive = this.game.alivePlayers().filter((p) => p != this.target);
    }
    var goodPlayers = alive.filter((p) => !this.isEvil(p));

    if (goodPlayers.length <= 0) {
      this.mainInfo = "no Evildoers exist.";
      return;
    }

    var goodTarget = Random.randArrayVal(goodPlayers);

    this.mainInfo = goodTarget;
  }
  makeFavorable() {}
  makeUnfavorable() {}
};
