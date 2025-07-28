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

module.exports = class TrueAndFalseInfo extends Information {
  constructor(creator, game) {
    super("True And False Info", creator, game);

    let possibleInfo = [];
    if (this.game.alivePlayers().length > 3) {
      possibleInfo.push("CompareAlignmentInfo");
    }
    if (this.game.alivePlayers().length > 3) {
      possibleInfo.push("NeighborAlignmentInfo");
    }
    if (this.game.alivePlayers().length > 3) {
      possibleInfo.push("GuessPlayerNeighborRoleInfo");
    }
    if (
      this.game.alivePlayers().length <= 3 ||
      this.game.IsBloodMoon == true
    ) {
      possibleInfo.push("BinaryAlignmentInfo");
    }
    if (
      this.game.deadPlayers().length >= 2 &&
      this.game.setup.noReveal == true
    ) {
      possibleInfo.push("EvilDeadCountInfo");
    }
    if (
      this.game.deadPlayers().length >= 1 &&
      this.game.setup.noReveal == true
    ) {
      possibleInfo.push("DeadRoleInfo");
    }
    if (
      this.game.alivePlayers().length <= 3 ||
      this.game.IsBloodMoon == true
    ) {
      possibleInfo.push("RoleInfo");
    }
    if (this.game.deadPlayers().length == 0 && this.game.alivePlayers().length > 3) {
      possibleInfo.push("EvilPairsInfo");
    }
    if (this.game.alivePlayers().length >= 4) {
      possibleInfo.push("GuessPlayerVisitRoleInfo");
    }
    let playerHasItems = false;
    for (let player of this.game.alivePlayers()) {
      if (this.snoopAllItems(player, true).length > 0) {
        playerHasItems = true;
      }
    }
    if (playerHasItems == true) {
      possibleInfo.push("ItemInfo");
    }
    let roles = this.game.PossibleRoles.filter((r) => r);
    let players = this.game.players.filter((p) => p.role);
    let currentRoles = [];

    for (let x = 0; x < players.length; x++) {
      currentRoles.push(
        `${this.game.formatRoleInternal(
          players[x].role.name,
          players[x].role.modifier
        )}`
      );
    }
    for (let y = 0; y < currentRoles.length; y++) {
      roles = roles.filter((r) => r != `${currentRoles[y]}`);
    }
    if (roles.length >= 1) {
      possibleInfo.push("ExcessRolesInfo");
    }

    this.possibleInfo = possibleInfo;

    let info = this.chooseInfoTypes();
    info[0].makeTrue();
    info[1].makeFalse();
    info = Random.randomizeArray(info);

    this.mainInfo = info;

    //this.game.queueAlert(`:invest: Main ${this.mainInfo} Invest ${target.getRoleAppearance("investigate")} Real ${this.trueRole}.`);
  }

  getInfoRaw() {
    super.getInfoRaw();
    return `(${this.mainInfo[0].getInfoSpecial()}) OR (${this.mainInfo[1].getInfoSpecial()})`;
  }

  getInfoFormated() {
    super.getInfoRaw();
    return `You learn that EITHER (${this.mainInfo[0].getInfoSpecial()}) OR (${this.mainInfo[1].getInfoSpecial()}) is True!`;
  }

  isTrue() {
    if (
      (this.mainInfo[0].isTrue() && this.mainInfo[1].isFalse()) ||
      (this.mainInfo[0].isFalse() && this.mainInfo[1].isTrue())
    ) {
      return true;
    }
    return false;
  }
  isFalse() {
    if (this.mainInfo[0].isFalse() && this.mainInfo[1].isFalse()) {
      return true;
    }
    return false;
  }
  isFavorable() {
    if (this.mainInfo[0].isFavorable() && this.mainInfo[1].isFavorable()) {
      return true;
    }
    return false;
  }
  isUnfavorable() {
    if (this.mainInfo[0].isUnfavorable() && this.mainInfo[1].isUnfavorable()) {
      return true;
    }
    return false;
  }

  makeTrue() {
    this.mainInfo[0].makeTrue();
    this.mainInfo[1].makeFalse();
    this.mainInfo = Random.randomizeArray(this.mainInfo);
  }
  makeFalse() {
    this.mainInfo[0].makeFalse();
    this.mainInfo[1].makeFalse();
  }
  makeFavorable() {
    this.mainInfo[0].makeFavorable();
    this.mainInfo[1].makeFavorable();
  }
  makeUnfavorable() {
    this.mainInfo[0].makeUnfavorable();
    this.mainInfo[1].makeUnfavorable();
  }

  chooseInfoTypes() {
    let info = [];
    let realInfo = [];
    let ran = Random.randomizeArray(this.possibleInfo);
    info.push(ran[0]);
    info.push(ran[1]);
    for (let word of info) {
      if (word == "CompareAlignmentInfo") {
        realInfo.push(
          this.game.createInformation(
            "CompareAlignmentInfo",
            this.creator,
            this.game
          )
        );
      } else if (word == "NeighborAlignmentInfo") {
        realInfo.push(
          this.game.createInformation(
            "NeighborAlignmentInfo",
            this.creator,
            this.game
          )
        );
      } else if (word == "GuessPlayerNeighborRoleInfo") {
        realInfo.push(
          this.game.createInformation(
            "GuessPlayerNeighborRoleInfo",
            this.creator,
            this.game,
            Random.randomizeArray(this.game.alivePlayers())[0],
            Random.randomizeArray(this.game.PossibleRoles.filter((r) => r))[0]
          )
        );
      } else if (word == "BinaryAlignmentInfo") {
        realInfo.push(
          this.game.createInformation(
            "BinaryAlignmentInfo",
            this.creator,
            this.game
          )
        );
      } else if (word == "EvilDeadCountInfo") {
        realInfo.push(
          this.game.createInformation(
            "EvilDeadCountInfo",
            this.creator,
            this.game
          )
        );
      } else if (word == "DeadRoleInfo") {
        realInfo.push(
          this.game.createInformation(
            "RoleInfo",
            this.creator,
            this.game,
            Random.randomizeArray(this.game.deadPlayers())[0]
          )
        );
      } else if (word == "RoleInfo") {
        realInfo.push(
          this.game.createInformation("RoleInfo", this.creator, this.game)
        );
      } else if (word == "EvilPairsInfo") {
        realInfo.push(
          this.game.createInformation("EvilPairsInfo", this.creator, this.game)
        );
      } else if (word == "GuessPlayerVisitRoleInfo") {
        realInfo.push(
          this.game.createInformation(
            "GuessPlayerVisitRoleInfo",
            this.creator,
            this.game,
            Random.randomizeArray(this.game.alivePlayers())[0],
            Random.randomizeArray(this.game.PossibleRoles.filter((r) => r))[0]
          )
        );
      } else if (word == "ItemInfo") {
        realInfo.push(
          this.game.createInformation("ItemInfo", this.creator, this.game)
        );
      } else if (word == "ExcessRolesInfo") {
        realInfo.push(
          this.game.createInformation(
            "ExcessRolesInfo",
            this.creator,
            this.game,
            1
          )
        );
      }
    }
    return realInfo;
  }
};
