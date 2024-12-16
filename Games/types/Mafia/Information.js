const Action = require("../../core/Action");
const Random = require("../../../lib/Random");
const Player = require("../../core/Player");
const {
  EVIL_FACTIONS,
  NOT_EVIL_FACTIONS,
  CULT_FACTIONS,
  MAFIA_FACTIONS,
  FACTION_LEARN_TEAM,
  FACTION_WIN_WITH_MAJORITY,
  FACTION_WITH_MEETING,
  FACTION_KILL,
} = require("./const/FactionList");

module.exports = class MafiaInformation {
  constructor(name, creator, game) {
    this.name = name;
    this.creator = creator;
    this.game = game;
    this.mainInfo = true;
  }

  processInfo() {
    if (this.creator != null) {
      if (this.creator.hasEffect("TrueMode")) {
        if (!this.isTrue()) {
          this.makeTrue();
        }
      } else if (this.creator.hasEffect("FalseMode")) {
        if (!this.isFalse()) {
          this.makeFalse();
        }
      } else if (this.creator.hasEffect("UnfavorableMode")) {
        if (!this.isUnfavorable()) {
          this.makeUnfavorable();
        }
      } else if (this.creator.hasEffect("FavorableMode")) {
        if (!this.isFavorable()) {
          this.makeFavorable();
        }
      }
    }
  }

  getInfoRaw() {
    this.game.events.emit("Information", this);
  }

  getInfoFormated() {
    this.game.events.emit("Information", this);
  }

  isTrue() {
    return true;
  }
  isFalse() {
    return false;
  }
  isFavorable() {
    return false;
  }
  isUnfavorable() {
    return true;
  }

  makeTrue() {}
  makeFalse() {}
  makeFavorable() {}
  makeUnfavorable() {}

  getVisits(player){

    var visits = [];
    for (let action of this.game.actions[0]) {
      let toCheck = action.target;
      if (!Array.isArray(action.target)) {
        toCheck = [action.target];
      }

      if (
        action.actors.indexOf(player) != -1 &&
        !action.hasLabel("hidden") &&
        action.target &&
        toCheck[0] instanceof Player
      ) {
        visits.push(...toCheck);
      }
    }

    return visits;
  }

  getVisitors(player, label){

    var visitors = [];
    for (let action of this.game.actions[0]) {
      if (label && !action.hasLabel(label)) {
        continue;
      }

      let toCheck = action.target;
      if (!Array.isArray(action.target)) {
        toCheck = [action.target];
      }

      for (let target of toCheck) {
        if (target === player && !action.hasLabel("hidden")) {
          visitors.push(...action.actors);
        }
      }
    }

    return Random.randomizeArray(visitors);
  }
  
  isAppearanceEvil(player, type) {
    let revealType = type || "investigate";
    if (
      player.getRoleAppearance(revealType) ==
      this.game.formatRole(
        this.game.formatRoleInternal(player.role.name, player.role.modifier)
      )
    ) {
      return this.isEvil(player);
    }

    if (
      this.game.getRoleAlignment(player.getRoleAppearance().split(" (")[0]) ==
        "Cult" ||
      this.game.getRoleAlignment(player.getRoleAppearance().split(" (")[0]) ==
        "Mafia" ||
      (this.game.getRoleAlignment(player.getRoleAppearance().split(" (")[0]) ==
        "Independent" &&
        this.game
          .getRoleTags(player.getRoleAppearance().split(" (")[0])
          .includes("Hostile"))
    ) {
      return true;
    }
    return false;
  }
  isEvil(player) {
    if (
      EVIL_FACTIONS.includes(player.faction) ||
      (player.faction == "Independent" &&
        this.game.getRoleTags(player.role.name).includes("Hostile"))
    ) {
      return true;
    }
    return false;
  }
};
