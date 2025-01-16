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

module.exports = class RevealPlayersWithRoleInfo extends Information {
  constructor(creator, game, revealTo, role) {
    super("Reveal Players Role Info", creator, game);
    if (revealTo == null) {
      revealTo = "Self";
    }
    if (role == null) {
      role = "Villager";
    }
    this.role = role;
    this.revealTo = revealTo;
    let playersWithRole = this.game.players.filter(
      (p) => p.getRoleAppearance("reveal").split(" (")[0] == this.role
    );
    this.mainInfo = playersWithRole;
    this.maxRoleCount = playersWithRole.length;
    this.truthValue = "Normal";
  }

  getInfoRaw() {
    super.getInfoRaw();
    let playersWithRole = this.game.players.filter(
      (p) => p.getRoleAppearance("reveal").split(" (")[0] == this.role
    );
    let OtherRoles = [];
    for (let item of playersWithRole) {
      if (item.tempAppearance["reveal"] != null) {
        OtherRoles.push(
          `${item.tempAppearance["reveal"]}:${item.tempAppearanceMods["reveal"]}`
        );
      } else {
        OtherRoles.push(
          `${item.role.appearance["reveal"]}:${item.role.appearanceMods["reveal"]}`
        );
      }
    }
    if (OtherRoles.length < this.mainInfo.length) {
      OtherRoles = this.game.PossibleRoles.filter(
        (r) => r.split(":")[0] == this.role
      );
    }

    OtherRoles = Random.randomizeArray(OtherRoles);
    let number = 0;
    for (let playerB of this.mainInfo) {
      let tempTempAppearanceMods = playerB.tempAppearanceMods["reveal"];
      let tempTempAppearance = playerB.tempAppearance["reveal"];

      if (this.truthValue == "Normal") {
        this.revealTarget(playerB);
      } else if (this.truthValue == "True") {
        playerB.setTempAppearance(
          "reveal",
          this.game.formatRoleInternal(playerB.role.name, playerB.role.modifier)
        );
        this.revealTarget(playerB);
      } else if (this.truthValue == "False") {
        playerB.setTempAppearance("reveal", OtherRoles[number]);
        this.revealTarget(playerB);
      }

      playerB.tempAppearanceMods["reveal"] = tempTempAppearanceMods;
      playerB.tempAppearance["reveal"] = tempTempAppearance;
      number++;
    }
  }

  getInfoFormated() {
    this.getInfoRaw();
  }

  revealTarget(playerToReveal) {
    if (this.revealTo == "All") {
      playerToReveal.role.revealToAll();
    }
    if (this.revealTo == "Faction") {
      for (let player of this.game.players) {
        if (player.faction == this.creator.faction) {
          playerToReveal.role.revealToPlayer(player);
        }
      }
    }
    if (this.revealTo == "Self") {
      playerToReveal.role.revealToPlayer(this.creator);
    }
  }

  isTrue() {
    let players = this.game.players.filter((p) => p.role.name == this.role);
    if (this.mainInfo.length != players.length) {
      return false;
    }
    for (let player of players) {
      if (!this.mainInfo.includes(player)) {
        return false;
      }
    }
    return true;
  }
  isFalse() {
    let players = this.game.players.filter((p) => p.role.name == this.role);
    for (let player of players) {
      if (this.mainInfo.includes(player)) {
        return false;
      }
    }
    return true;
  }
  isFavorable() {
    return true;
  }
  isUnfavorable() {
    return true;
  }

  makeTrue() {
    let players = this.game.players.filter((p) => p.role.name == this.role);
    this.mainInfo = players;
    this.truthValue = "True";
  }
  makeFalse() {
    let players = this.game.players.filter(
      (p) => p.role.name != this.role && p != this.creator
    );
    players = Random.randomizeArray(players);
    let goodPlayers = [];
    for (let x = 0; x < players.length && x < this.maxRoleCount; x++) {
      goodPlayers.push(players[x]);
    }
    this.mainInfo = goodPlayers;
    this.truthValue = "False";
  }
  makeFavorable() {}
  makeUnfavorable() {}
};
