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

module.exports = class RevealEvilPlayersInfo extends Information {
  constructor(creator, game) {
    super("Reveal Evil Players Info", creator, game, revealTo);
    if (revealTo == null) {
      revealTo == "Self";
    }
    let evilPlayers = this.game.players.filter((p) => this.game.getRoleAlignment(p.getRoleAppearance("reveal").split(" (")) == "Mafia" || this.game.getRoleAlignment(this.game.getRoleAppearance(p).split(" (")) == "Cult");
    this.mainInfo = evilPlayers;
    this.maxEvilCount = evilPlayers.length;
    this.truthValue = "Normal";
  }

  getInfoRaw() {
    super.getInfoRaw();
    for(let playerB of this.mainInfo){
    let tempTempAppearanceMods =
      playerB.tempAppearanceMods[this.investType];
    let tempTempAppearance = playerB.tempAppearance[this.investType];
    let OtherRoles = this.game.PossibleRoles.filter(
      (r) =>
        r !=
          this.game.formatRoleInternal(
            playerB.role.name,
            playerB.role.modifier
          ) &&
        !this.game.getRoleTags(r).includes("No Investigate") &&
        !this.game.getRoleTags(r).includes("Exposed")
    );
    OtherRoles = Random.randomizeArray(OtherRoles);
    if (this.truthValue == "Normal") {
      this.revealTarget();
    } else if (this.truthValue == "True") {
      playerB.setTempAppearance(
        this.investType,
        this.game.formatRoleInternal(
          playerB.role.name,
          playerB.role.modifier
        )
      );
      this.revealTarget();
    } else if (this.truthValue == "False") {
      playerB.setTempAppearance(this.investType, OtherRoles[0]);
      this.revealTarget();
    } 

    playerB.tempAppearanceMods[this.investType] = tempTempAppearanceMods;
    playerB.tempAppearance[this.investType] = tempTempAppearance;
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
    let players = this.game.players.filter((p) => EVIL_FACTIONS.includes(p.faction)));
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
    let players = this.game.players.filter((p) => EVIL_FACTIONS.includes(p.faction)));
    for (let player of players) {
      if (!this.mainInfo.includes(player)) {
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
   let players = this.game.players.filter((p) => EVIL_FACTIONS.includes(p.faction)));
  this.mainInfo = players;
  this.truthValue = "True";
  }
  makeFalse() {
  let players = this.game.players.filter((p) => !EVIL_FACTIONS.includes(p.faction) && p != this.creator));
    players = Random.randomizeArray(players);
    let goodPlayers = [];
    for(let x = 0; x < players.length && x < this.maxEvilCount; x++){
      goodPlayers.push(players[x]);
    }
  this.mainInfo = goodPlayers;
  this.truthValue = "False";
  }
  makeFavorable() {
  }
  makeUnfavorable() {
  }
};
