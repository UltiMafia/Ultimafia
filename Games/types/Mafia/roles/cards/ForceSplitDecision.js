const Card = require("../../Card");
const Random = require("../../../../../lib/Random");
const {
  PRIORITY_INVESTIGATIVE_AFTER_RESOLVE_DEFAULT,
} = require("../../const/Priority");
const { PRIORITY_ROOM_SWAP } = require("../../const/Priority");

module.exports = class ForceSplitDecision extends Card {
  constructor(role) {
    super(role);

    this.actions = [
      {
        labels: ["hidden", "absolute"],
        priority: PRIORITY_ROOM_SWAP + 5,
        run: function () {
          if (!this.actor.alive) return;
          this.game.statesSinceLastDeath = 0;
          for (let player of this.game.RoomOne) {
            player.holdItem("NoVillageMeeting");
          }
          for (let player of this.game.RoomTwo) {
            player.holdItem("NoVillageMeeting");
          }
          if (
            (this.game.getStateName() == "Dusk" ||
              this.game.getStateName() == "Day") &&
            this.game.HasGiven == 1
          ) {
            this.game.HasGiven = 2;
            if (
              this.game.RoomOneLeader == null ||
              !this.game.RoomOneLeader.alive
            ) {
              let roomOne = this.game.RoomOne.filter((p) => p.alive);
              this.game.RoomOneLeader = roomOne[0];
            }
            if (
              this.game.RoomTwoLeader == null ||
              !this.game.RoomTwoLeader.alive
            ) {
              let roomTwo = this.game.RoomTwo.filter((p) => p.alive);
              this.game.RoomTwoLeader = roomTwo[0];
            }
            this.game.RoomOneLeader.holdItem("RoomLeader", this.game, 1);
            this.game.RoomTwoLeader.holdItem("RoomLeader", this.game, 2);
          }

          if (
            (this.game.getStateName() == "Dawn" ||
              this.game.getStateName() == "Night") &&
            this.game.HasGiven == 2
          ) {
            this.game.HasGiven = 1;
            this.game.CurrentRound = this.game.CurrentRound + 1;
            this.game.queueAlert(
              `Round ${this.game.CurrentRound}! Elect a Leader`
            );
            if (this.game.currentSwapAmt > 1) {
              this.game.currentSwapAmt = this.game.currentSwapAmt - 1;
            }
            for (let player of this.game.RoomOne) {
              player.holdItem("Room", "Room 1");
            }
            for (let player of this.game.RoomTwo) {
              player.holdItem("Room", "Room 2");
            }
            let hosts = this.game
              .alivePlayers()
              .filter((p) => p.role.name == "Host");
            for (let host of hosts) {
              host.holdItem("Room", "Room 1");
              host.holdItem("Room", "Room 2");
              host.giveEffect("CannotVote", 1, "Room 1");
              host.giveEffect("CannotVote", 1, "Room 2");
              host.giveEffect("CannotBeVoted", 1);
              for (let item of host.items) {
                if (item.name == "Room") {
                  if (item.meetings["Room 1"]) {
                    item.meetings["Room 1"].canVote = false;
                  }
                  if (item.meetings["Room 2"]) {
                    item.meetings["Room 2"].canVote = false;
                  }
                }
              }
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
        if(this.game.Rooms.length > 0){
          return;
        }
        if(!this.hasAbility(["OnlyWhenAlive"])){
          return;
        }
        let RoomCount;
        if(this.modifier){
          RoomCount = this.role.modifier.split("/").filter((m) => m == "X-Shot").length
        }
        else{
          RoomCount = 2;
        }
        let playerCount = this.game.players.filter((p) => p.role.name == "Host").length;
        let playersPerRoom = playerCount/RoomCount;
        let extraPlayers = playerCount%RoomCount;
        let rooms = [];
        let playersRandom = Random.randomizeArray(this.game.players.filter((p) => p.role.name == "Host"));
        for(let x < 0; x < RoomCount; x++){
          let room = {
          name: "Room "+(x+1),
          members: [],
          leader: null,
          }
          for(let y < 0; y < playersPerRoom; y++){
            room.members.push(playersRandom.pop());
          }
          this.game.Rooms.push(room);
        }
        
        
        /*
        const Presidents = this.game.players.filter(
          (p) =>
            p.alive &&
            (p.hasEffect("PresidentEffect") || p.hasEffect("SenatorEffect"))
        );
        if (Presidents <= 0) {
          let players = this.game
            .alivePlayers()
            .filter(
              (p) =>
                (p.role.alignment == "Village" ||
                  p.role.alignment == "Independent") &&
                p.role.data.UnReplaceable != true
            );
          let shuffledPlayers = Random.randomizeArray(players);
          shuffledPlayers[0].setRole("President");
        }*/
        if (this.game.HasGiven != 1 && this.game.HasGiven != 2) {
          this.game.HasGiven = 2;
        }
        let playersToRoom = this.game
          .alivePlayers()
          .filter((p) => p.role.name != "Host");

        if (this.game.RoomOne.length <= 0 || this.game.RoomTwo.length <= 0) {
          for (let x = 0; x < playersToRoom.length; x++) {
            if (x % 2 == 0) {
              this.game.RoomOne.push(playersToRoom[x]);
            }
            if (x % 2 != 0) {
              this.game.RoomTwo.push(playersToRoom[x]);
            }
          }
        }
        if (this.game.alivePlayers().length <= 13) {
          this.game.currentSwapAmt = 1;
        } else if (this.game.alivePlayers().length <= 21) {
          this.game.currentSwapAmt = 2;
        } else {
          this.game.currentSwapAmt = 3;
        }
      },
    };
  }
};
