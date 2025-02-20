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

module.exports = class PlayerRoleRelationInfo extends Information {
  constructor(creator, game, player, role, relation, noMods) {
    super("Player Role Relation Info", creator, game);

    if (noMods == null || noMods == false) {
      this.noMods = false;
    } else {
      this.noMods = true;
    }

    this.target = player;
    this.role = role;
    this.relation = relation.toUpperCase();
    let info;
    if (this.relation == "IS") {
      info = this.game.createInformation(
        "GuessRoleInfo",
        this.creator,
        this.game,
        [this.target],
        [this.role],
        this.noMods
      );
    }
    if (this.relation == "NEIGHBORS") {
      info = this.game.createInformation(
        "GuessPlayerNeighborRoleInfo",
        this.creator,
        this.game,
        this.target,
        this.role,
        this.noMods
      );
    }
    if (this.relation == "HAS VISITED") {
      info = this.game.createInformation(
        "GuessPlayerVisitRoleInfo",
        this.creator,
        this.game,
        this.target,
        this.role,
        this.noMods
      );
    }
    if (this.relation == "WAS VISITED BY") {
      info = this.game.createInformation(
        "GuessPlayerVisitorRoleInfo",
        this.creator,
        this.game,
        this.target,
        this.role,
        this.noMods
      );
    }

    info.processInfo();
    this.mainInfo = info;
  }

  getInfoRaw() {
    return this.mainInfo.getInfoRaw();
  }

  getInfoFormated() {
    return this.mainInfo.getInfoFormated();
  }

  getGuessMessages() {
    this.creator.queueAlert(
      `:poison: You ask if ${this.target.name} ${
        this.relation
      } ${this.game.formatRole(this.role)}.`
    );
  }

  isTrue() {
    return this.mainInfo.isTrue();
  }
  isFalse() {
    return this.mainInfo.isFalse();
  }
  isFavorable() {
    return this.mainInfo.isFavorable();
  }
  isUnfavorable() {
    return this.mainInfo.isUnfavorable();
  }

  makeTrue() {
    this.mainInfo.makeTrue();
  }
  makeFalse() {
    this.mainInfo.makeFalse();
  }
  makeFavorable() {
    this.mainInfo.makeFavorable();
  }
  makeUnfavorable() {
    this.mainInfo.Unfavorable();
  }
};
