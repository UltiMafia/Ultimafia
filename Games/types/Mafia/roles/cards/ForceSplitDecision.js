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
        priority: PRIORITY_SWAP_ROLES+5,
        run: function () {
          if (!this.actor.alive) return;
          this.game.statesSinceLastDeath = 0;
          for(let player of this.game.RoomOne){
            player.holdItem("NoVillageMeeting");
          }
          for(let player of this.game.RoomTwo){
            player.holdItem("NoVillageMeeting");
          }
          if ((this.game.getStateName() == "Dusk" || this.game.getStateName() == "Day") && this.game.HasGiven == 1){
            this.game.HasGiven = 2;
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
            
          }

          if ((this.game.getStateName() == "Dawn" || this.game.getStateName() == "Night") && this.game.HasGiven == 2){
            this.game.HasGiven = 1;
            this.game.CurrentRound = this.game.CurrentRound+1;
            this.game.queueAlert(
              `Round ${this.game.CurrentRound}! Elect a Leader`
            );
            if(this.game.currentSwapAmt>1){ 
              this.game.currentSwapAmt = this.game.currentSwapAmt-1;
              }
            for(let player of this.game.RoomOne){
              player.holdItem("Room","Room 1");
            }
            for(let player of this.game.RoomTwo){
              player.holdItem("Room","Room 2");
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
        const Presidents = this.game.players.filter(
          (p) =>
            p.alive &&
            (p.role.name == "President" || p.role.name == "Senator")
        );
        if(Presidents <= 0){
          let players = this.game.players.filter(
            (p) =>
              p.role.alignment == "Village" || p.role.alignment == "Independent"
          );
          let shuffledPlayers = Random.randomizeArray(players);
          shuffledPlayers[0].setRole("President");
        }
        if(this.game.HasGiven != 1 && this.game.HasGiven != 2){
          this.game.HasGiven = 2;
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
