const Information = require("../Information");
const { addArticle } = require("../../../core/Utils");
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

module.exports = class GuessPlayerVisitRoleInfo extends Information {
  constructor(creator, game, player, role, noMods) {
    super("Guess Player Visit Role Info", creator, game);

    if (noMods == null || noMods == false) {
      this.noMods = false;
    } else {
      this.noMods = true;
    }

    this.target = player;
    this.role = role;
    let correctCount = 0;
    let visitors = this.getVisitors(this.target, null, true);

    for (let x = 0; x < visitors.length; x++) {
      if (
        !this.noMods &&
        visitors[x].getRoleAppearance() == this.game.formatRole(this.role)
      ) {
        correctCount++;
      } else if (
        this.noMods &&
        visitors[x].getRoleAppearance().split(" (")[0] ==
          this.game.formatRole(this.role.split(":")[0])
      ) {
        correctCount++;
      }
    }
    if (correctCount > 0) {
      this.mainInfo = true;
    } else {
      this.mainInfo = false;
    }
  }

  getInfoRaw() {
    super.getInfoRaw();
    return this.mainInfo;
  }

  getInfoFormated() {
    super.getInfoRaw();
    let guess;
    if (this.mainInfo == true) {
      guess = "Correct";
    } else {
      guess = "Incorrect";
    }
    return `Your guess that ${this.target.name} Was Visited By ${addArticle(
      this.game.formatRole(this.role)
    )} was ${guess}!`;
  }

  isTrue() {
    let correctCount = 0;
    let visitors = this.getVisitors(this.target, null, true);
    for (let x = 0; x < visitors.length; x++) {
      if (
        !this.noMods &&
        this.game.formatRoleInternal(
          visitors[x].role.name,
          visitors[x].role.modifier
        ) == this.role
      ) {
        correctCount = true;
      } else if (
        this.noMods &&
        this.game.formatRoleInternal(
          visitors[x].role.name,
          visitors[x].role.modifier
        ) == this.role.split(":")[0]
      ) {
        correctCount = true;
      }
    }
    if (this.mainInfo == correctCount) {
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
    let correctCount = 0;
    let visitors = this.getVisitors(this.target, null, true);
    for (let x = 0; x < visitors.length; x++) {
      if (
        this.game.getRoleAlignment(this.role) != "Cult" ||
        this.game.getRoleAlignment(this.role) != "Mafia" ||
        !(
          this.game.getRoleAlignment(this.role) == "Independent" &&
          this.game.getRoleTags(this.role).includes("Hostile")
        )
      ) {
        correctCount = true;
      }
    }
    if (this.mainInfo == correctCount) {
      return true;
    } else {
      return false;
    }
  }
  isUnfavorable() {
    let correctCount = 0;
    let visitors = this.getVisitors(this.target, null, true);
    for (let x = 0; x < visitors.length; x++) {
      if (
        this.game.getRoleAlignment(this.role) == "Cult" ||
        this.game.getRoleAlignment(this.role) == "Mafia" ||
        (this.game.getRoleAlignment(this.role) == "Independent" &&
          this.game.getRoleTags(this.role).includes("Hostile"))
      ) {
        correctCount = true;
      }
    }
    if (this.mainInfo == correctCount) {
      return true;
    } else {
      return false;
    }
  }

  makeTrue() {
    let correctCount = 0;
    let visitors = this.getVisitors(this.target, null, true);

    for (let x = 0; x < visitors.length; x++) {
      if (
        !this.noMods &&
        this.game.formatRoleInternal(
          visitors[x].role.name,
          visitors[x].role.modifier
        ) == this.role
      ) {
        correctCount++;
      } else if (
        this.noMods &&
        visitors.target.role.name == this.role.split(":")[0]
      ) {
        correctCount++;
      }
    }
    if (correctCount > 0) {
      this.mainInfo = true;
    } else {
      this.mainInfo = false;
    }
  }
  makeFalse() {
    this.makeTrue();
    if (this.mainInfo == true) {
      this.mainInfo = false;
    } else {
      this.mainInfo = true;
    }
  }
  makeFavorable() {
    let correctCount = false;
    let visitors = this.getVisitors(this.target, null, true);
    for (let x = 0; x < visitors.length; x++) {
      if (
        this.game.getRoleAlignment(this.role) != "Cult" ||
        this.game.getRoleAlignment(this.role) != "Mafia" ||
        !(
          this.game.getRoleAlignment(this.role) == "Independent" &&
          this.game.getRoleTags(this.role).includes("Hostile")
        )
      ) {
        correctCount = true;
      }
    }
    this.mainInfo = correctCount;
  }
  makeUnfavorable() {
    let correctCount = false;
    let visitors = this.getVisitors(this.target, null, true);
    for (let x = 0; x < visitors.length; x++) {
      if (
        this.game.getRoleAlignment(this.role) == "Cult" ||
        this.game.getRoleAlignment(this.role) == "Mafia" ||
        (this.game.getRoleAlignment(this.role) == "Independent" &&
          this.game.getRoleTags(this.role).includes("Hostile"))
      ) {
        correctCount = true;
      }
    }
    this.mainInfo = true;
  }
};
