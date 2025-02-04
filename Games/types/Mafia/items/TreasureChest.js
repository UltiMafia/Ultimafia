const Item = require("../Item");

module.exports = class TreasureChest extends Item {
  constructor(Admiral) {
    super("TreasureChest");

    this.Admiral = Admiral;
    this.cannotBeStolen = true;
    this.cannotBeSnooped = true;
    let meetingName;
      meetingName ="Choose Role " + this.holder.name;
  this.meetingName = meetingName;


    this.meetings = {};
  
    };
  }



  setupMeetings() {
    let alivePlayers = this.game.alivePlayers().filter((p) => p.role.name != "Host");
    let indexOfPlayer = players.indexOf(this.holder);
    let leftIdx = (indexOfPlayer - 1 + alivePlayers.length) % alivePlayers.length;
    let rightBIdx = (indexOfPlayer - 1 + alivePlayers.length) % alivePlayers.length;
    this.ExcessAdmiralGoodRoles = this.game.AdmiralGoodRoles.filter((p) => p);
    this.ExcessAdmiralGoodRoles.push("None");
    
    if(this.game.ExcessAdmiralGoodRoles.length >= 0 && alivePlayers[leftIdx].role.name == "Admiral") {
    this.meetings[`${this.holder.name} Excess`] = {
        actionName: "Discard a Role",
        states: ["Dusk", "Dawn"],
        flags: ["voting", "instant"],
        inputType: "custom",
        targets: this.ExcessAdmiralGoodRoles,
        canUnvote: false,
        action: {
          item: this,
          run: function () {
            this.game.AdmiralGoodRoles.splice(this.game.AdmiralGoodRoles.indexOf(this.target),1);
              this.item.drop();
            }
          },
    }
  }
  if(this.game.AdmiralGoodRoles.length > 0) {
    this.meetings[`${this.meetingName}`] = {
        actionName: "Choose a Role",
        states: ["Dusk", "Dawn"],
        flags: ["voting", "instant", "instantButChangeable", "repeatable"],
        inputType: "custom",
        targets: this.game.AdmiralGoodRoles,
        canUnvote: false,
        action: {
          item: this,
          run: function () {
            this.actor.setRole(`${this.target}`);
            this.game.AdmiralGoodRoles.splice(this.game.AdmiralGoodRoles.indexOf(this.target),1);
            this.item.drop();
            let players = this.game.alivePlayers().filter((p) => p.role.name != "Host");
            let index = players.indexOf(this.actor);
            let rightIdx = (index + 1) % players.length;
            if(players[rightIdx].role.name != "Admiral"){
            players[rightIdx].holdItem("TreasureChest",this.item.Admiral);
            this.game.instantMeeting(ShareWith.meetings, [players[rightIdx]]);
            }
              this.actor.getMeetings().forEach((meeting) => {
                if (meeting.name == this.item.meetingName) {
                  meeting.leave(this.actor, true);
                }
                if (meeting.name == `${this.actor.name} Amount`) {
                  meeting.leave(this.actor, true);
                }
                if (meeting.name == `${this.actor.name} Excess`) {
                  meeting.leave(this.actor, true);
                }
                if (meeting.name == `${this.actor.name} Grouch`) {
                meeting.leave(this.actor, true);
                }
              });
            }
          },
    }
  }


  if((this.game.AdmiralGold <= 0 && this.game.AdmiralGoodRoles.length <= 0) || alivePlayers[rightBIdx].role.name == "Admiral") {
    this.meetings[`${this.meetingName}`] = {
        actionName: "Become Grouch",
        states: ["Dusk", "Dawn"],
        flags: ["voting", "instant", "instantButChangeable", "repeatable"],
        inputType: "custom",
        targets: ["Yes"],
        canUnvote: false,
        action: {
          item: this,
          run: function () {
            this.actor.setRole(`Grouch`);
            this.item.drop();
            let players = this.game.alivePlayers().filter((p) => p.role.name != "Host");
            let index = players.indexOf(this.actor);
            let rightIdx = (index + 1) % players.length;
            if(players[rightIdx].role.name != "Admiral"){
            players[rightIdx].holdItem("TreasureChest",this.item.Admiral);
            this.game.instantMeeting(ShareWith.meetings, [players[rightIdx]]);
            }
              this.actor.getMeetings().forEach((meeting) => {
                if (meeting.name == this.item.meetingName) {
                  meeting.leave(this.actor, true);
                }
                if (meeting.name == `${this.actor.name} Amount`) {
                  meeting.leave(this.actor, true);
                }
                if (meeting.name == `${this.actor.name} Excess`) {
                  meeting.leave(this.actor, true);
                }
                if (meeting.name == `${this.actor.name} Grouch`) {
                meeting.leave(this.actor, true);
                }
              });
            }
          },
    }
  }

    
    if(this.game.AdmiralGold > 0){
    this.meetings[`${this.holder.name} Amount`] = {
        actionName: "Steal Gold (Enter an Amount)?",
        states: ["Dusk", "Dawn"],
        flags: [
          "voting",
          "instant",
          "instantButChangeable",
          "repeatable",
          "noVeg",
        ],
        inputType: "text",
        textOptions: {
          minNumber: 1,
          minLength: 1,
          maxLength: 5,
          numericOnly: true,
          submit: "Confirm",
        },
        action: {
          item: this,
          run: function () {
            this.target = parseInt(this.target);

            if(this.target <= 0){
            this.game.sendAlert("You may only take 1 or more Gold from the Chest.",
                    [this.actor]
                  );
            meeting.unvote(this.actor, true, true);
            }

            if(this.actor.role.name == "Admiral" && this.target > 5){
            this.game.sendAlert("An Admiral may only hold on to 5 or less Gold from the Chest.",
                    [this.actor]
                  );
            meeting.unvote(this.actor, true, true);
            }

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
            this.item.drop();

            let players = this.game.alivePlayers().filter((p) => p.role.name != "Host");
            let index = players.indexOf(this.actor);
            let rightIdx = (index + 1) % players.length;
            if(players[rightIdx].role.name != "Admiral"){
            players[rightIdx].holdItem("TreasureChest",this.item.Admiral);
            this.game.instantMeeting(ShareWith.meetings, [players[rightIdx]]);
            }
              this.actor.getMeetings().forEach((meeting) => {
                if (meeting.name == this.item.meetingName) {
                  meeting.leave(this.actor, true);
                }
                if (meeting.name == `${this.actor.name} Amount`) {
                  meeting.leave(this.actor, true);
                }
                if (meeting.name == `${this.actor.name} Excess`) {
                  meeting.leave(this.actor, true);
                }
                if (meeting.name == `${this.actor.name} Grouch`) {
                meeting.leave(this.actor, true);
                }
              });
            }
          },
        }
  }
    
      }//Setup Meetings


  hold(player) {
    super.hold(player);

    player.sendAlert(`You have received the Admiral's Treasure Chest!`);
    player.sendAlert(`Inside are ${player.game.AdmiralGold} Gold Bars and the following roles ${player.game.AdmiralGoodRoles}!`);
    player.sendAlert(`You may steal Gold and Become Mafia/Cult Or Become a role in the Chest!`);

    this.setupMeetings();
  }



};
