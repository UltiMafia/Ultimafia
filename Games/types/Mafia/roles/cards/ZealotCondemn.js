const Card = require("../../Card");
const Random = require("../../../../../lib/Random");
const { PRIORITY_WIN_CHECK_DEFAULT } = require("../../const/Priority");
const {
  EVIL_FACTIONS,
  NOT_EVIL_FACTIONS,
  CULT_FACTIONS,
  MAFIA_FACTIONS,
  FACTION_LEARN_TEAM,
  FACTION_WIN_WITH_MAJORITY,
  FACTION_WITH_MEETING,
  FACTION_KILL,
} = require("../../const/FactionList");

module.exports = class ZealotCondemn extends Card {
  constructor(role) {
    super(role);
    this.target = "";


    this.winCheckSpecial = {
      priority: PRIORITY_WIN_CHECK_DEFAULT,
      againOnFinished: true,
      check: function (counts, winners, aliveCount, confirmedFinished) {
        if(!this.player.hasAbility(["Win-Con"])){
          return;
        }
            
              
        if (this.data.ZealotWin && this.player.hasAbility(["Win-Con"])) {
          for(let player of this.game.players){
            if(CULT_FACTIONS.includes(player.faction)){
              winners.addPlayer(player, player.faction);
            }
          }
        }
      },
    };

    this.listeners = {
      Devotion: function (EndangeredPlayer) {
        this.data.ZealotCondemn = true;
      },
      state: function (stateInfo) {
        if (!this.player.hasAbility(["Win-Con"])) return;
        if (stateInfo.name.match(/Day/)) {
          if (this.data.ZealotCondemn == true) {
            this.player.queueAlert(
              `After the Death of your beloved master, You Call apon the Dark Gods to Smite the Village. They demand that a Village Aligned player be condemned. If no one is condemned the Dark Gods will Smite your Alignment.`
            );
            this.data.ZealotDay = true;
          }
        }
        if (stateInfo.name.match(/Night/)) {
          if (this.data.ZealotDay == true) {
            this.data.ZealotDay = false;
            this.data.ZealotCondemn = false;
            for (let p of this.game.alivePlayers()) {
              if (p.faction === this.player.faction) {
                p.kill("basic", this.player, true);
              }
            }
          }
        }
      },
      roleAssigned: function (player) {
        if (player !== this.player) {
          return;
        }
        this.data.ZealotWin = false;
      },
      death: function (player, killer, deathType) {
        if (
          player.faction === "Village" &&
          deathType == "condemn" &&
          this.player.hasAbility(["Win-Con"]) &&
          this.data.ZealotDay == true
        ) {
          this.data.ZealotWin = true;
        }
      },
    };
  }
};
