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

module.exports = class MournerInfo extends Information {
  constructor(creator, game) {
    super("Mourner Info", creator, game);

    let numYes = this.creator.role.mournerYes;
    let numNo = this.creator.role.mournerNo;

    let totalResponses = numYes + numNo;

    let percentNo = Math.round((numNo / totalResponses) * 100);
    let percentYes = Math.round((numYes / totalResponses) * 100);

    if (totalResponses === 0) {
      this.mainInfo = `You receive no responses from the dead.`;
    } else {
      this.mainInfo = `The dead has replied with ${percentYes}% Yes's and ${percentNo}% No's to your question "${this.creator.role.data.question}".`;
    }
  }

  getInfoRaw() {
    super.getInfoRaw();
    return this.mainInfo;
  }

  getInfoFormated() {
    super.getInfoRaw();
    return this.mainInfo;
  }

  isTrue() {
    let numYes = this.creator.role.mournerYes;
    let numNo = this.creator.role.mournerNo;

    let totalResponses = numYes + numNo;

    let percentNo = Math.round((numNo / totalResponses) * 100);
    let percentYes = Math.round((numYes / totalResponses) * 100);

    if (
      totalResponses === 0 &&
      this.mainInfo == `You receive no responses from the dead.`
    ) {
      return true;
    } else if (
      this.mainInfo ==
      `The dead has replied with ${percentYes}% Yes's and ${percentNo}% No's to your question "${this.creator.role.data.question}".`
    ) {
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
    if (
      this.mainInfo ==
      `The dead has replied with ${100}% Yes's and ${0}% No's to your question "${
        this.creator.role.data.question
      }".`
    ) {
      return true;
    } else {
      return false;
    }
  }
  isUnfavorable() {
    if (
      this.mainInfo ==
      `The dead has replied with ${0}% Yes's and ${100}% No's to your question "${
        this.creator.role.data.question
      }".`
    ) {
      return true;
    } else {
      return false;
    }
  }

  makeTrue() {
    let numYes = this.creator.role.mournerYes;
    let numNo = this.creator.role.mournerNo;

    let totalResponses = numYes + numNo;

    let percentNo = Math.round((numNo / totalResponses) * 100);
    let percentYes = Math.round((numYes / totalResponses) * 100);

    if (totalResponses === 0) {
      this.mainInfo = `You receive no responses from the dead.`;
    } else {
      this.mainInfo = `The dead has replied with ${percentYes}% Yes's and ${percentNo}% No's to your question "${this.creator.role.data.question}".`;
    }
  }
  makeFalse() {
    let numYes = this.creator.role.mournerYes;
    let numNo = this.creator.role.mournerNo;

    let totalResponses = numYes + numNo;

    let percentNo = Math.round((numNo / totalResponses) * 100);
    let percentYes = Math.round((numYes / totalResponses) * 100);

    if (totalResponses === 0) {
      this.mainInfo = `The dead has replied with ${0}% Yes's and ${100}% No's to your question "${
        this.creator.role.data.question
      }".`;
    } else {
      this.mainInfo = `The dead has replied with ${percentNo}% Yes's and ${percentYes}% No's to your question "${this.creator.role.data.question}".`;
    }
  }
  makeFavorable() {
    this.mainInfo = `The dead has replied with ${100}% Yes's and ${0}% No's to your question "${
      this.creator.role.data.question
    }".`;
  }
  makeUnfavorable() {
    this.mainInfo = `The dead has replied with ${0}% Yes's and ${100}% No's to your question "${
      this.creator.role.data.question
    }".`;
  }
};
