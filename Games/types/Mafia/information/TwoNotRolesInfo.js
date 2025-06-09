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

module.exports = class TwoNotRolesInfo extends Information {
  constructor(creator, game, target, investType, learner) {
    super("Two Not Roles Info", creator, game);
    if (investType == null) {
      investType = "investigate";
    }
    this.investType = investType;
    if (target == null) {
      this.randomTarget = true;
      target = Random.randArrayVal(
        this.game.alivePlayers().filter((p) => p != learner)
      );
    }
    if (learner == null) {
      learner = this.creator;
    }
    this.target = target;
    this.learner = learner;

    this.targetRole = this.target
      .getRoleAppearance(this.investType)
      .split(" (")[0];
    let info = this.getFakeRole(this.target, 2, false, this.investType, null, null, true);
    let trueRole = this.game.formatRoleInternal(
      target.role.name,
      target.role.modifier
    );
    this.trueRole = this.game.formatRole(trueRole);
    this.mainInfo = info;

    //this.game.queueAlert(`:invest: Main ${this.mainInfo} Invest ${target.getRoleAppearance("investigate")} Real ${this.trueRole}.`);
  }

  getInfoRaw() {
    super.getInfoRaw();
    return Random.randomizeArray(this.mainInfo);
  }

  getInfoFormated() {
    super.getInfoRaw();
    let info = Random.randomizeArray(this.mainInfo);
    return `You Learn that ${this.target.name}'s Role is not ${info[0]}, or ${info[1]}.`;
    //return `You Learn that your Target's Role is ${this.mainInfo}`
  }

  isTrue() {
    if (!this.mainInfo.includes(this.trueRole)) {
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
    for (let role of this.mainInfo) {
      if (this.game.getRoleAlignment(role.split(" (")[0]) == "Village") {
        return false;
      }
    }
    return true;
  }
  isUnfavorable() {
    for (let role of this.mainInfo) {
      if (this.game.getRoleAlignment(role.split(" (")[0]) != "Village") {
        return false;
      }
    }
    return true;
  }

  makeTrue() {
    let roles = this.getFakeRole(
      this.target,
      2,
      false,
      this.investType,
      null,
      true
    );

    this.mainInfo = roles;
    this.targetRole = roles[0].split(":")[0];
  }
  makeFalse() {
    let info = this.getFakeRole(this.target, 1, false, this.investType);
    info.push(this.trueRole);
    this.mainInfo = info;
    this.targetRole = this.target.role.name;
  }
  makeFavorable() {
    let roles = this.getFakeRole(
      this.target,
      2,
      false,
      this.investType,
      "Evil"
    );

    this.mainInfo = roles;
    this.targetRole = roles[0].split(":")[0];
  }
  makeUnfavorable() {
    let roles = this.getFakeRole(
      this.target,
      2,
      false,
      this.investType,
      "Village"
    );

    this.mainInfo = roles;
    this.targetRole = roles[0].split(":")[0];
  }
};
