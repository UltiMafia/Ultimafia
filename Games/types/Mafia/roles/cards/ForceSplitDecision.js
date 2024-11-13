const Card = require("../../Card");
const Random = require("../../../../../lib/Random");
const { PRIORITY_INVESTIGATIVE_AFTER_RESOLVE_DEFAULT } = require("../../const/Priority");
const { PRIORITY_SWAP_ROLES } = require("../../const/Priority");

module.exports = class ForceSplitDecision extends Card {
  constructor(role) {
    super(role);


    this.actions = [
      {
        labels: ["hidden", "absolute"],
        priority: PRIORITY_INVESTIGATIVE_AFTER_RESOLVE_DEFAULT,
        run: function () {
          if (!this.actor.alive) return;
          if ((this.game.getStateName() == "Dusk" || this.game.getStateName() == "Day")&& this.game.HasGiven == 1){
            this.game.HasGiven == 2;
            if(this.game.RoomOneLeader == null || !this.game.RoomOneLeader.alive){
              let roomOne = this.game.RoomOne.filter((p)=> p.alive);
              this.game.RoomOneLeader = roomOne[0];
            }
            if(this.game.RoomTwoLeader == null || !this.game.RoomTwoLeader.alive){
              let roomTwo = this.game.RoomTwo.filter((p)=> p.alive);
              this.game.RoomTwoLeader = roomTwo[0];
            }
              this.game.RoomOneLeader.holdItem("RoomLeader",this.game, 1);
              this.game.RoomTwoLeader.holdItem("RoomLeader",this.game, 2);

             for(let player of this.game.RoomOne){
              player.holdItem("NoVillageMeeting");
            }
            for(let player of this.game.RoomTwo){
              player.holdItem("NoVillageMeeting");
            }
            
          }

          if ((this.game.getStateName() == "Dawn" || this.game.getStateName() == "Night")&& this.game.HasGiven == 2;){
            this.game.HasGiven = 1;
            this.game.CurrentRound = this.game.CurrentRound+1;
            if(this.game.currentSwapAmt>1){ 
              this.game.currentSwapAmt = this.game.currentSwapAmt-1;
              }
            for(let player of this.game.RoomOne){
              player.holdItem("Room","Room 1");
              player.holdItem("NoVillageMeeting");
            }
            for(let player of this.game.RoomTwo){
              player.holdItem("Room","Room 2");
              player.holdItem("NoVillageMeeting");
            }
            
            
          }

        },
      },
    ];

    this.listeners = {
      roleAssigned: function (player) {
        if (this.player !== player) {
          return;
        }
        if(this.game.HasGiven == null || this.game.HasGiven == 0){
          this.game.HasGiven == 2
        }
        if(this.game.RoomOne.length <= 0 || this.game.RoomTwo.length <= 0){
          for(let x = 0; x < this.game.alivePlayers().length;x++){
            if(x % 2 == 0){
              this.game.RoomOne.push(this.game.alivePlayers()[x])
            }
            if(x % 2 != 0){
            this.game.RoomTwo.push(this.game.alivePlayers()[x])
            }
          }
        }
        if(this.game.alivePlayers().length <= 13){
        this.game.currentSwapAmt = 1;
        }
        else if(this.game.alivePlayers().length <= 21){
        this.game.currentSwapAmt = 2;
        }
        else{
        this.game.currentSwapAmt = 3;
        }
      },
    };
    
  }
};
