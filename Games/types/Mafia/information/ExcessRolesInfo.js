const Information = require("../Information");
const Random = require("../../../../lib/Random");
const { normalizeRole, roleEquals } = require("../../../../lib/roleIdentity");
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

module.exports = class ExcessRolesInfo extends Information {
  constructor(creator, game, amount, goodRolesOnly) {
    super("Excess Roles Info", creator, game);
    if (amount == null) {
      amount = 1;
    }
    this.amount = amount;
    if (goodRolesOnly == null) {
      if (this.isEvil(this.creator)) {
        this.goodRolesOnly = true;
      } else {
        this.goodRolesOnly = false;
      }
    } else if (goodRolesOnly == false) {
      this.goodRolesOnly = false;
    } else {
      this.goodRolesOnly = true;
    }

    let roles = this.game.PossibleRoles.filter((r) => r);
    let players = this.game.players.filter((p) => p.role);
    const currentRoles = players.map((player) => player.role);
    roles = roles.filter(
      (role) => !currentRoles.some((currentRole) => roleEquals(role, currentRole))
    );
    if (this.goodRolesOnly) {
      roles = roles.filter((r) => this.game.getRoleAlignment(r) == "Village");
    }
    let info = [];
    if (this.amount > roles.length) {
      this.LimtedExcess = true;
      for (let x = 0; x < roles.length; x++) {
        info.push(roles[x]);
      }
    } else {
      this.LimtedExcess = false;
      roles = Random.randomizeArray(roles);
      for (let x = 0; x < this.amount; x++) {
        info.push(roles[x]);
      }
    }

    this.mainInfo = info;
  }

  getInfoRaw() {
    super.getInfoRaw();
    return this.mainInfo;
  }

  getInfoFormated() {
    super.getInfoRaw();
    let shuffledChosen = Random.randomizeArray(this.mainInfo).map((r) =>
      this.game.formatRole(r)
    );
    if (this.LimtedExcess && this.mainInfo.length <= 0) {
      return `You learn that there are 0 Excess Roles!`;
    }
    if (this.LimtedExcess) {
      return `You learn that all of the Excess Roles are ${shuffledChosen}`;
    }
    return `You learn that ${this.amount} of the Excess Roles are ${shuffledChosen}`;
    //return `You Learn that your Target's Role is ${this.mainInfo}`
  }

  getInfoSpecial() {
    let shuffledChosen = Random.randomizeArray(this.mainInfo).map((r) =>
      this.game.formatRole(r)
    );
    if (this.LimtedExcess && this.mainInfo.length <= 0) {
      return `There are 0 Excess Roles!`;
    }
    if (this.LimtedExcess) {
      return `${shuffledChosen} are Excess Roles`;
    }
    return `${this.amount} of the Excess Roles is ${shuffledChosen}`;
    //return `You Learn that your Target's Role is ${this.mainInfo}`
  }

  isTrue() {
    let roles = this.game.PossibleRoles.filter((r) => r);
    let players = this.game.players.filter((p) => p.role);
    const currentRoles = players.map((player) => player.role);
    roles = roles.filter(
      (role) => !currentRoles.some((currentRole) => roleEquals(role, currentRole))
    );
    if (this.goodRolesOnly) {
      roles = roles.filter((r) => this.game.getRoleAlignment(r) == "Village");
    }
    return this.mainInfo.every((info) => roles.some((role) => roleEquals(role, info)));
  }
  isFalse() {
    if (!this.isTrue()) {
      return true;
    } else {
      return false;
    }
  }
  isFavorable() {
    return true;
  }
  isUnfavorable() {
    return true;
  }

  makeTrue() {
    let roles = this.game.PossibleRoles.filter((r) => r);
    let players = this.game.players.filter((p) => p.role);
    const currentRoles = players.map((player) => player.role);
    roles = roles.filter(
      (role) => !currentRoles.some((currentRole) => roleEquals(role, currentRole))
    );
    if (this.goodRolesOnly) {
      roles = roles.filter((r) => this.game.getRoleAlignment(r) == "Village");
    }
    let info = [];
    if (this.amount > roles.length) {
      this.LimtedExcess = true;
      for (let x = 0; x < roles.length; x++) {
        info.push(roles[x]);
      }
    } else {
      this.LimtedExcess = false;
      roles = Random.randomizeArray(roles);
      for (let x = 0; x < this.amount; x++) {
        info.push(roles[x]);
      }
    }

    this.mainInfo = info;
  }
  makeFalse() {
    let roles = this.game.PossibleRoles.filter((r) => r);
    let players = this.game.players.filter((p) => p.role);
    let currentRoles = players.map((player) => normalizeRole(player.role));
    roles = roles.filter(
      (role) => !currentRoles.some((currentRole) => roleEquals(role, currentRole))
    );
    if (this.goodRolesOnly) {
      currentRoles = currentRoles.filter(
        (role) => this.game.getRoleAlignment(role) == "Village"
      );
    }
    let info = [];
    if (this.amount > currentRoles.length) {
      this.LimtedExcess = true;
      for (let x = 0; x < currentRoles.length; x++) {
        info.push(currentRoles[x]);
      }
    } else {
      this.LimtedExcess = false;
      currentRoles = Random.randomizeArray(currentRoles);
      for (let x = 0; x < this.amount; x++) {
        info.push(currentRoles[x]);
      }
    }

    this.mainInfo = info;
  }
  makeFavorable() {}
  makeUnfavorable() {}
};
