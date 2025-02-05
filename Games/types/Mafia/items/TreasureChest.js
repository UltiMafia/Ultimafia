const Item = require("../Item");
const Random = require("../../../../lib/Random");

module.exports = class TreasureChest extends Item {
  constructor(Admiral) {
    super("TreasureChest");

    this.Admiral = Admiral;
    this.cannotBeStolen = true;
    this.cannotBeSnooped = true;


    this.meetings = {};
  
    };
  



  setupMeetings() {
    let alivePlayers = this.game.alivePlayers().filter((p) => p.role.name != "Host");
    let indexOfPlayer = alivePlayers.indexOf(this.holder);
    let leftIdx = (indexOfPlayer - 1 + alivePlayers.length) % alivePlayers.length;
    let rightBIdx = (indexOfPlayer + 1) % alivePlayers.length;
    this.ExcessAdmiralGoodRoles = this.game.AdmiralGoodRoles.filter((p) => p);
    this.ExcessAdmiralGoodRoles.push("None");
    
    if(this.ExcessAdmiralGoodRoles.length >= 0 && alivePlayers[leftIdx].role.name == "Admiral") {
    this.meetings[`${this.holder.name} Excess`] = {
        actionName: "Discard a Role",
        states: ["Dusk", "Dawn"],
        flags: ["voting", "instant", "hideAfterVote"],
        inputType: "custom",
        targets: this.ExcessAdmiralGoodRoles,
        canUnvote: false,
        action: {
          item: this,
          run: function () {
            this.game.AdmiralGoodRoles.splice(this.game.AdmiralGoodRoles.indexOf(this.target),1);
              
            }
          },
    }
  }
  if(this.game.AdmiralGoodRoles.length > 0 && this.holder.role.name != "Admiral") {
    this.meetings[`${this.meetingName}`] = {
        actionName: "Choose a Role",
        states: ["Dusk", "Dawn"],
        flags: ["voting", "instant", "hideAfterVote"],
        inputType: "custom",
        targets: this.game.AdmiralGoodRoles,
        canUnvote: false,
        action: {
          item: this,
          run: function () {
            this.actor.setRole(`${this.target}`);
            this.game.AdmiralGoodRoles.splice(this.game.AdmiralGoodRoles.indexOf(this.target),1);
  
            let players = this.game.alivePlayers().filter((p) => p.role.name != "Host");
            let index = players.indexOf(this.actor);
            let rightIdx = (index + 1) % players.length;
            if(players[rightIdx].role.name != "Admiral"){
            let ShareWith = players[rightIdx].holdItem("TreasureChest",this.item.Admiral);
            this.game.instantMeeting(ShareWith.meetings, [players[rightIdx]]);
            }
            else{
              players[rightIdx].sendAlert(`Your Treasure Chest has returned!`);
              players[rightIdx].sendAlert(`Inside are ${this.game.AdmiralGold} Gold Bars and the following roles ${this.game.AdmiralGoodRoles}!`);
              players[rightIdx].sendAlert(`Ask players about what they saw in the chest when it got to them to deduce the Mafia or Cult!`);
            }
              this.actor.getMeetings().forEach((meeting) => {
               
                  meeting.leave(this.actor, true);
                 
              });
              this.item.drop();
            }
          },
    }
  }


  if((this.game.AdmiralGold <= 0 && this.game.AdmiralGoodRoles.length <= 0 && this.holder.role.name != "Admiral") || alivePlayers[rightBIdx].role.name == "Admiral") {
    this.meetings[`${this.holder.name} Grouch`] = {
        actionName: "Become Grouch",
        states: ["Dusk", "Dawn"],
        flags: ["voting", "instant"],
        inputType: "custom",
        targets: ["Yes"],
        canUnvote: false,
        action: {
          item: this,
          run: function () {
            this.actor.setRole(`Grouch`);
            let players = this.game.alivePlayers().filter((p) => p.role.name != "Host");
            let index = players.indexOf(this.actor);
            let rightIdx = (index + 1) % players.length;
            if(players[rightIdx].role.name != "Admiral"){
            let ShareWith = players[rightIdx].holdItem("TreasureChest",this.item.Admiral);
            this.game.instantMeeting(ShareWith.meetings, [players[rightIdx]]);
            }
            else{
              players[rightIdx].sendAlert(`Your Treasure Chest has returned!`);
              players[rightIdx].sendAlert(`Inside are ${this.game.AdmiralGold} Gold Bars and the following roles ${this.game.AdmiralGoodRoles}!`);
              players[rightIdx].sendAlert(`Ask players about what they saw in the chest when it got to them to deduce the Mafia or Cult!`);
            }
              this.actor.getMeetings().forEach((meeting) => {
                
                  meeting.leave(this.actor, true);
               
              });
              this.item.drop();
            }
          },
    }
  }

    
    if(this.game.AdmiralGold > 0){
      let numberTargets = [];
      if(this.holder.role.name != "Admiral"){
      for(let x = 1; x <= this.game.AdmiralGold; x++){
        numberTargets.push(""+x);
      }
    }
    else{
      for(let x = 1; x <= 5; x++){
        numberTargets.push(""+x);
      }
    }
    this.meetings[`${this.holder.name} Amount`] = {
        actionName: "Steal Gold (Enter an Amount)?",
        states: ["Dusk", "Dawn"],
        flags: [
          "voting",
          "instant"
        ],
        inputType: "custom",
        targets: numberTargets,
        action: {
          item: this,
          run: function () {
            this.target = parseInt(this.target);

            if(this.target > this.game.AdmiralGold){
              this.target = this.game.AdmiralGold;
            }

            this.actor.Gold += this.target;
            this.game.AdmiralGold -= this.target;

            if(this.actor.role.name != "Admiral"){
              if(this.game.AdmiralEvilRoles.length <= 0){
              const evilRoles = role.game.PossibleRoles.filter((r) => role.game.getRoleAlignment(r) === "Cult" || role.game.getRoleAlignment(r) === "Mafia");
                let role;
                if(evilRoles.length <= 0){
                  role = `Mafioso:Lone`;
                }
                else{
                  role = Random.randArrayVal(evilRoles);
                }
                this.actor.setRole(`${role}`);
                
              }
               else{
                 let role = Random.randArrayVal(this.game.AdmiralEvilRoles);
                 this.actor.setRole(`${role}`);
              }
            }
            

            let players = this.game.alivePlayers().filter((p) => p.role.name != "Host");
            let index = players.indexOf(this.actor);
            let rightIdx = (index + 1) % players.length;
            if(players[rightIdx].role.name != "Admiral"){
            let ShareWith = players[rightIdx].holdItem("TreasureChest",this.item.Admiral);
            this.game.instantMeeting(ShareWith.meetings, [players[rightIdx]]);
            }
            else{
              players[rightIdx].sendAlert(`Your Treasure Chest has returned!`);
              players[rightIdx].sendAlert(`Inside are ${this.game.AdmiralGold} Gold Bars and the following roles ${this.game.AdmiralGoodRoles}!`);
              players[rightIdx].sendAlert(`Ask players about what they saw in the chest when it got to them to deduce the Mafia or Cult!`);
            }
              this.actor.getMeetings().forEach((meeting) => {
                  meeting.leave(this.actor, true);
              });
              this.item.drop();
            }
          },
        }
  }
    
      }//Setup Meetings


  hold(player) {
    super.hold(player);

    let meetingName;
    meetingName ="Choose Role " + this.holder.name;
    this.meetingName = meetingName;

    player.sendAlert(`You have received the Admiral's Treasure Chest!`);
    player.sendAlert(`Inside are ${player.game.AdmiralGold} Gold Bars and the following roles ${player.game.AdmiralGoodRoles}!`);
    player.sendAlert(`You may steal Gold and Become Mafia/Cult Or Become a role in the Chest!`);

    this.setupMeetings();
  }



};
