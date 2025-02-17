const Card = require("../../Card");
const Action = require("../../Action");
const { PRIORITY_OVERTHROW_VOTE } = require("../../const/Priority");

module.exports = class MustRoleShareWithVip extends Card {
  constructor(role) {
    super(role);
  this.playersSharedWith = [];
    this.listeners = {
      ShareRole: function (PlayerA, PlayerB, isAlignmentShare) {
        if (
          (PlayerA == this.player || PlayerB == this.player) &&
          !isAlignmentShare
        ) {
          let thisPlayer;
          let otherPlayer;
          if (PlayerA == this.player) {
            thisPlayer = PlayerA;
            otherPlayer = PlayerB;
          } else {
            thisPlayer = PlayerB;
            otherPlayer = PlayerA;
          }

           this.playersSharedWith.push(otherPlayer);

        }
      },
      handleWinBlockers: function (winners){
      let hasFailed = false;
      if(this.player.role.name == "Vice President"){
      for(let player of this.game.players){
        if(player.role.name == "President" && !this.playersSharedWith.includes(player)){
          hasFailed = true;
        }
        if(player.role.name == "Senator" && !this.playersSharedWith.includes(player)){
          hasFailed = true;
        }
        if( this.game.getRoleTags(
              this.game
                .formatRoleInternal(
                  this.player.role.name,
                  this.player.role.modifiers
                )
                .includes("Linchpin") && !this.playersSharedWith.includes(player)){
          hasFailed = true;
        }
      }
      }
      if(this.player.role.name == "Advisor"){
      for(let player of this.game.players){
        if(player.role.name == "Assassin" && !this.playersSharedWith.includes(player)){
          hasFailed = true;
        }
        if(player.role.name == "Queen" && !this.playersSharedWith.includes(player)){
          hasFailed = true;
        }
        if( this.game.getRoleTags(
              this.game
                .formatRoleInternal(
                  this.player.role.name,
                  this.player.role.modifiers
                )
                .includes("Linchpin") && !this.playersSharedWith.includes(player)){
          hasFailed = true;
        }
      }
      }
      if(hasFailed == true){
        winners.removeGroup(this.player.faction);
      }



      },
    };
  }
};
