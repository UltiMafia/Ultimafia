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

module.exports = class AllReportsInfo extends Information {
  constructor(creator, game, target) {
    super("Reports Info", creator, game);
    if (target == null) {
      this.randomTarget = true;
      target = Random.randArrayVal(this.game.alivePlayers());
    }
    this.target = target;

    let reports = this.getAllReports(this.target);
    this.mainInfo = reports;
  }

  getInfoRaw() {
    super.getInfoRaw();
    return this.mainInfo;
  }

  getInfoFormated() {
    super.getInfoRaw();
    let reports = this.mainInfo;
    let reportsToAlert = "nothing";
    if (reports.length > 0) {
      reportsToAlert = reports.join(", ");
    } else {
      return `You learn that ${this.target.name} received no reports.`;
    }

    return `You received all reports that ${this.target.name} has ever received: ${reportsToAlert}.`;
  }

  isTrue() {
    let reports = this.getAllReports(this.target);
    if (this.mainInfo.length != reports.length) {
      return false;
    }
    for (let report of reports) {
      if (!this.mainInfo.includes(report)) {
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
    if (this.mainInfo.length <= 0) {
      return true;
    } else {
      return false;
    }
  }
  isUnfavorable() {
    if (this.mainInfo.length >= 0) {
      return true;
    } else {
      return false;
    }
  }

  makeTrue() {
    let reports = this.getAllReports(this.target);
    this.mainInfo = reports;
  }
  makeFalse() {
    let reports = this.getAllReports(this.target);

    if (reports.length > 0) {
      this.mainInfo = [];
    } else {
      for (let player of this.game.players) {
        if (player != this.target && this.getAllReports(player).length > 0) {
          this.mainInfo = this.getAllReports(player);
          if (!this.isTrue()) {
            return;
          }
        }
      }
      let victim = Random.randArrayVal(
        this.game.players.filter((p) => p != this.creator && p != this.target)
      );
      this.mainInfo = [`:invest: You learn that ${victim.name} is Guilty.`];
    }
  }
  makeFavorable() {
    this.mainInfo = [];
  }
  makeUnfavorable() {
    for (let player of this.game.players) {
      if (player != this.target && this.getAllReports(player).length > 0) {
        this.mainInfo = this.getAllReports(player);
        if (!this.isTrue()) {
          return;
        }
      }
    }
    let victim = Random.randArrayVal(
      this.game.players.filter((p) => p != this.creator && p != this.target)
    );
    this.mainInfo = [`:invest: You learn that ${victim.name} is Guilty.`];
  }
};
