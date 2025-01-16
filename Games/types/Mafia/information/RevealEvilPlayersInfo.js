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
    let evilPlayers = this.game.players.filter((p) => this.game.getRoleAlignment(p.getRoleAppearance("reveal").split(" (")) == "Mafia" || this.game.getRoleAlignment(p.getRoleAppearance("reveal").split(" (")) == "Cult");
    this.mainInfo = evilPlayers;
    this.maxEvilCount = evilPlayers.length;
    this.truthValue = "Normal";
  }

  getInfoRaw() {
    super.getInfoRaw();
    let evilPlayers = this.game.players.filter((p) => this.game.getRoleAlignment(p.getRoleAppearance("reveal").split(" (")) == "Mafia" || this.game.getRoleAlignment(p.getRoleAppearance("reveal").split(" (")) == "Cult");
    let OtherRoles = [];
    for(let item of evilPlayers){
      if(item.tempAppearance["reveal"] != null){
      OtherRoles.push(`${item.tempAppearance["reveal"]}:${item.tempAppearanceMods["reveal"];}`);
      }
      else{
      OtherRoles.push(`${item.role.appearance["reveal"]}:${item.role.appearanceMods["reveal"];}`);
      }
    }
    if(OtherRoles.length < this.mainInfo.length){
      OtherRoles = this.game.PossibleRoles.filter((r) => r != this.game.formatRoleInternal(this.target.role.name, this.target.role.modifier) &&
        !this.game.getRoleTags(r).includes("No Investigate") &&
        !this.game.getRoleTags(r).includes("Exposed") && 
    );
      OtherRoles = OtherRoles.filter((r) => this.game.getRoleAlignment(r.split(":")[0]) != "Mafia" || this.game.getRoleAlignment(r.split(":")[0]) == "Cult");
    }
    

    OtherRoles = Random.randomizeArray(OtherRoles);
    let number = 0;
    for(let playerB of this.mainInfo){
    let tempTempAppearanceMods = playerB.tempAppearanceMods["reveal"];
    let tempTempAppearance = playerB.tempAppearance["reveal"];
      
    if (this.truthValue == "Normal") {
      this.revealTarget();
    } else if (this.truthValue == "True") {
      playerB.setTempAppearance(
        "reveal",
        this.game.formatRoleInternal(
          playerB.role.name,
          playerB.role.modifier
        )
      );
      this.revealTarget();
    } else if (this.truthValue == "False") {
      playerB.setTempAppearance("reveal", OtherRoles[number]);
      this.revealTarget();
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
