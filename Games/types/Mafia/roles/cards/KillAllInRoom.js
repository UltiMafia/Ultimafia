const Card = require("../../Card");
const Action = require("../../Action");
const { PRIORITY_KILL_DEFAULT } = require("../../const/Priority");

module.exports = class KillAllInRoom extends Card {
  constructor(role) {
    super(role);
/*
    this.actions = [
      {
        priority: PRIORITY_KILL_DEFAULT,
        labels: ["kill"],
        run: function () {
          if (!this.actor.alive) return;
          if (
            this.game.getStateName() != "Night" &&
            this.game.getStateName() != "Dawn"
          )
            return;
          if (this.game.FinalRound < this.game.CurrentRound) {
            for (let people of this.game.players) {
              if (
                people.role.data.RoleTargetBackup == "President" ||
                people.role.data.RoleTargetBackup == "Assassin"
              ) {
                people.role.data.RoleTargetBackup = null;
              }
            }
            if (this.game.RoomOne.includes(this.actor)) {
              for (let x = 0; x < this.game.RoomOne.length; x++) {
                if (
                  this.dominates(this.game.RoomOne[x]) &&
                  this.game.RoomOne[x] != this.actor
                ) {
                  this.game.RoomOne[x].kill("basic", this.actor);
                }
              }
            } else if (this.game.RoomTwo.includes(this.actor)) {
              for (let x = 0; x < this.game.RoomTwo.length; x++) {
                if (
                  this.dominates(this.game.RoomTwo[x]) &&
                  this.game.RoomTwo[x] != this.actor
                ) {
                  this.game.RoomTwo[x].kill("basic", this.actor);
                }
              }
            }

            this.actor.kill("basic", this.actor);
          }
        },
      },
    ];
*/

    this.listeners = {
      state: function (stateInfo) {
        if (stateInfo.name.match(/Night/)){
          var action = new Action({
          actor: this.player,
          game: this.player.game,
          priority: PRIORITY_KILL_DEFAULT,
          labels: ["absolute", "hidden"],
          run: function () {
            if (!this.actor.alive) return;
          if (
            this.game.getStateName() != "Night" &&
            this.game.getStateName() != "Dawn"
          )
            return;
          if (this.game.FinalRound < this.game.CurrentRound) {
            for (let people of this.game.players) {
              if (
                people.role.data.RoleTargetBackup == "President" ||
                people.role.data.RoleTargetBackup == "Assassin"
              ) {
                people.role.data.RoleTargetBackup = null;
              }
            }
            for(let room of this.game.Rooms){
              if(room.members.includes(this.actor)){
                for(let member of room.members){
                  if(member != this.actor && this.dominates(member)){
                    member.kill("basic", this.actor);
                  }
                }
              }
            }
            for(let player of this.game.players){
              for(let item of player.items){
                if(item.name == "Room"){
                  item.drop();
                }
                if(item.name == "NoVillageMeeting"){
                  item.drop();
                }
              }
            }

            this.actor.kill("basic", this.actor);
          }
            
            
          },
        });
        this.game.queueAction(action);
        }
      },
    };


  }
};
