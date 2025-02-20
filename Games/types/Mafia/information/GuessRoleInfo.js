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

module.exports = class GuessRoleInfo extends Information {
  constructor(creator, game, players, roles, noMods) {
    super("Guess Role Info", creator, game);

    if (noMods == null || noMods == false) {
      this.noMods = false;
    } else {
      this.noMods = true;
    }

    this.target = players;
    this.roles = roles;
    let correctCount = 0;
    for (let x = 0; x < this.target.length; x++) {
      if (
        !this.noMods &&
        this.target[x].getRoleAppearance() ==
          this.game.formatRole(this.roles[x])
      ) {
        correctCount++;
      } else if (
        this.noMods &&
        this.target[x].getRoleAppearance().split(" (")[0] ==
          this.game.formatRole(this.roles[x].split(":")[0])
      ) {
        correctCount++;
      }
    }

    this.mainInfo = correctCount;
  }

  getInfoRaw() {
    super.getInfoRaw();
    return this.mainInfo;
  }

  getInfoFormated() {
    super.getInfoRaw();
    let guess;
    if (this.target.length == 0) {
      return `:invest: You made No Guesses!`;
    }
    if (this.target.length == 1) {
      if (this.mainInfo == 1) {
        guess = "Correct";
      } else {
        guess = "Incorrect";
      }
      return `Your guess that ${this.target[0].name} was ${addArticle(
        this.game.formatRole(this.roles[0])
      )} was ${guess}!`;
    }

    return `You learn that ${this.mainInfo} of your guesses were Correct!`;

    return this.mainInfo;
  }

  getGuessMessages() {
    for (let x = 0; x < this.target.length; x++) {
      this.creator.queueAlert(
        `:invest: You guessed ${this.target[x].name} as ${this.game.formatRole(
          this.roles[x]
        )}.`
      );
    }
  }

  isTrue() {
    let correctCount = 0;
    for (let x = 0; x < this.target.length; x++) {
      if (
        !this.noMods &&
        this.game.formatRoleInternal(
          this.target[x].role.name,
          this.target[x].role.modifier
        ) == this.game.formatRole(this.roles[x])
      ) {
        correctCount++;
      } else if (
        this.noMods &&
        this.target[x].role.name == this.roles[x].split(":")[0]
      ) {
        correctCount++;
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
    for (let x = 0; x < this.target.length; x++) {
      if (
        this.game.getRoleAlignment(this.roles[x]) != "Cult" ||
        this.game.getRoleAlignment(this.roles[x]) != "Mafia" ||
        !(
          this.game.getRoleAlignment(this.roles[x]) == "Independent" &&
          this.game.getRoleTags(this.roles[x]).includes("Hostile")
        )
      ) {
        correctCount++;
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
    for (let x = 0; x < this.target.length; x++) {
      if (
        this.game.getRoleAlignment(this.roles[x]) == "Cult" ||
        this.game.getRoleAlignment(this.roles[x]) == "Mafia" ||
        (this.game.getRoleAlignment(this.roles[x]) == "Independent" &&
          this.game.getRoleTags(this.roles[x]).includes("Hostile"))
      ) {
        correctCount++;
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
    for (let x = 0; x < this.target.length; x++) {
      if (
        !this.noMods &&
        this.game.formatRoleInternal(
          this.target[x].role.name,
          this.target[x].role.modifier
        ) == this.roles[x]
      ) {
        correctCount++;
      } else if (this.noMods && this.target[x].role.name == this.roles[x]) {
        correctCount++;
      }
    }

    this.mainInfo = correctCount;
  }
  makeFalse() {
    this.makeTrue();
    let correctCount = this.mainInfo;
    this.mainInfo = this.target.length - correctCount;
  }
  makeFavorable() {
    let correctCount = 0;
    for (let x = 0; x < this.target.length; x++) {
      if (
        this.game.getRoleAlignment(this.roles[x]) != "Cult" ||
        this.game.getRoleAlignment(this.roles[x]) != "Mafia" ||
        !(
          this.game.getRoleAlignment(this.roles[x]) == "Independent" &&
          this.game.getRoleTags(this.roles[x]).includes("Hostile")
        )
      ) {
        correctCount++;
      }
    }
    this.mainInfo = correctCount;
  }
  makeUnfavorable() {
    let correctCount = 0;
    for (let x = 0; x < this.target.length; x++) {
      if (
        this.game.getRoleAlignment(this.roles[x]) == "Cult" ||
        this.game.getRoleAlignment(this.roles[x]) == "Mafia" ||
        (this.game.getRoleAlignment(this.roles[x]) == "Independent" &&
          this.game.getRoleTags(this.roles[x]).includes("Hostile"))
      ) {
        correctCount++;
      }
    }
    this.mainInfo = correctCount;
  }
};
