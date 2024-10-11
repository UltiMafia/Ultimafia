const Card = require("../../Card");
const Random = require("../../../../../lib/Random");
const { PRIORITY_INVESTIGATIVE_DEFAULT } = require("../../const/Priority");
const { PRIORITY_SWAP_ROLES } = require("../../const/Priority");

module.exports = class GiveFactionAbility extends Card {
  constructor(role) {
    super(role);

    this.dayShorten = 0;

    this.actions = [
      {
        priority: PRIORITY_INVESTIGATIVE_DEFAULT,
        run: function () {
          if (!this.actor.alive) return;
          if (this.game.getStateName() != "Dusk" && this.game.getStateName() != "Sunset") return;


          let randomNumber = Random.randInt(0, 8);
          let targetTypes = ["Neighbors","Even","Odd","Left","Right"];
          let targetType = Random.randArrayVal(targetTypes);

          let roles = this.game.PossibleRoles.filter((r) => r);
          let players = this.game.players.filter((p) => p.role);
          let currentRoles = [];

          for (let x = 0; x < players.length; x++) {
            currentRoles.push(players[x].role);
          }
          for (let y = 0; y < currentRoles.length; y++) {
            roles = roles.filter(
              (r) => r.split(":")[0] != currentRoles[y].name
            );
          }

          if (this.actor.hasEffect("FalseMode")) {
            roles = currentRoles.map((r) => r.name);
          }

          switch(randomNumber){
            case 1:
              for (let player of this.game.players) {
              if (player.faction == this.actor.faction) {
                player.queueAlert(`A ${this.actor.role.name} has Granted your team the Ability to have Each Member learn a player's role.`);
                player.holdItem("WackyRoleLearner", targetType);
              }
              }
              return;
              break;
            case 2:
              for (let player of this.game.players) {
              if (player.faction == this.actor.faction) {
                player.queueAlert(`A ${this.actor.role.name} has Granted your team the Ability to reveal a player's role to the Team.`);
                player.holdItem("WackyFactionRoleReveal", targetType);
              }
              }
              return;
              break;
            case 3:
              for (let player of this.game.players) {
              if (player.faction == this.actor.faction) {
                this.holder.queueAlert(`A ${this.actor.role.name} has Granted your team the Ability to learn 1 Excess Role.`);
                 if (roles.length <= 0) {
                  player.queueAlert(`You learn There are 0 excess roles.`);
                } else {
                  var role1 = Random.randArrayVal(roles);
                  player.queueAlert(`You learn ${role1} is an Excess role`);
                        }
              }
              }
              return;
              break;
            case 4:
              for (let player of this.game.players) {
              if (player.faction == this.actor.faction) {
                player.queueAlert(`A ${this.actor.role.name} has Granted your team an Ability the does Nothing!`);
              }
              }
              return;
              break;
            case 5:
              for (let player of this.game.players) {
              if (player.faction == this.actor.faction) {
                player.queueAlert(`A ${this.actor.role.name} has Granted your team an Ability the Shortens the Day!`);
             }
              }
                this.dayShorten = this.dayShorten*2;
              if(this.dayShorten > 32){
                this.dayShorten = 32;
              }
              return;
              break;
            case 6:
              for (let player of this.game.players) {
              if (player.faction == this.actor.faction) {
                player.queueAlert(`A ${this.actor.role.name} has Granted your team an Ability that makes all Team member give their role to the closest team member below them on the list at the end of the night! (Looping around at the bottem)`);
              }
              }
                this.swapFaction = "Right";
              
              return;
              break;
            case 7:
              for (let player of this.game.players) {
              if (player.faction == this.actor.faction) {
                player.queueAlert(`A ${this.actor.role.name} has Granted your team an Ability that makes all Team member give their role to the closest team member above them on the list at the end of the night! (Looping around at the Top)`);
              }
              }
                this.swapFaction = "Left";
              
              return;
              break;
            case 8:
              for (let player of this.game.players) {
              if (player.faction == this.actor.faction) {
                player.queueAlert(`A ${this.actor.role.name} has Granted your team the Ability to learn Eachothers roles!`);
                for(let p of this.game.players){
                  if (player.faction == p.faction){
                    player.role.revealToPlayer(p);
                  }
                }
              }
              }
              return;
              break;
          }
        },
      },
      {
        priority: PRIORITY_SWAP_ROLES-1,
        run: function () {
          if (this.game.getStateName() != "Night") return;
          if(this.swapFaction != "Left" && this.swapFaction != "Right") return;

          let teammates = this.game.players.filter((p) => p.faction == this.actor.faction && p.alive);
          var indexOfActor = players.indexOf(this.item.holder);
          let leftIndex = (indexOfActor - 1 + players.length) % players.length;
          let rightIdx = (indexOfActor + 1) % players.length;
          let tempRole;
          let tempMod;
          let tempData;
          if(this.swapFaction == "Right"){
            this.swapFaction = null;
          for(let x = 0; x<teammates.length;x++){
            if(x == 0){
              tempRole = teammates[x].role.name;
              tempMod = teammates[x].role.modifier;
              tempData = teammates[x].role.data;
            }
            if(x != teammates.length-1){
              teammates[x].setRole(
              `${ teammates[x+1].role.name}:${ teammates[x+1].role.modifier}`,
               teammates[x+1].role.data,
              false,
              false,
              true,"No Change"
            );
            }
            else{
              teammates[x].setRole(
              `${tempRole}:${tempMod}`,
               tempData,
              false,
              false,
              true,"No Change"
            );
            }
          }
        }

        if(this.swapFaction == "Left"){
            this.swapFaction = null;
          for(let x = 0; x<teammates.length;x++){
            if(x == 0){
              tempRole = teammates[teammates.length-1-x].role.name;
              tempMod = teammates[teammates.length-1-x].role.modifier;
              tempData = teammates[teammates.length-1-x].role.data;
            }
            if(x != teammates.length-1){
              teammates[teammates.length-1-x].setRole(
              `${ teammates[teammates.length-1-x-1].role.name}:${ teammates[teammates.length-1-x-1].role.modifier}`,
               teammates[teammates.length-1-x-1].role.data,
              false,
              false,
              true,"No Change"
            );
            }
            else{
              teammates[teammates.length-1-x].setRole(
              `${tempRole}:${tempMod}`,
               tempData,
              false,
              false,
              true,"No Change"
            );
            }
          }
        }
          for(let x = 0; x<teammates.length;x++){
          this.game.events.emit("roleAssigned", this.actor);
          }

          
        },
        
      },
    ];


    this.stateMods = {
      Sunset: {
        type: "add",
        index: 6,
        length: 1000 * 60,
        shouldSkip: function () {
          
            if (this.player.alive) {
              return false;
            }
          
          return true;
        },
      },
      Day: {
        type: "time",
        length: (1000*60*10)/(1+this.dayShorten),
      },
    };
    
  }
};
