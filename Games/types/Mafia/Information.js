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

  isAppearanceEvil(player) {
    if (
      player.getRoleAppearance() ==
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
