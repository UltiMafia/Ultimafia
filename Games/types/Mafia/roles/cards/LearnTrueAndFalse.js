const Card = require("../../Card");
const Random = require("../../../../../lib/Random");
const { PRIORITY_DAY_DEFAULT } = require("../../const/Priority");
const { PRIORITY_KILL_DEFAULT } = require("../../const/Priority");

module.exports = class LearnTrueAndFalse extends Card {
  constructor(role) {
    super(role);

    role.openedDoor = false;

    this.meetings = {
      "Get Info": {
        states: ["Day"],
        flags: ["voting"],
        inputType: "boolean",
        action: {
          priority: PRIORITY_DAY_DEFAULT,
          run: function () {
            if (this.target == "No") return;

            let infoTypes = [true,false];

            if(this.actor.hasEffect("FalseMode")){
              infoTypes = [false,false]
            }

            let info = [];

            let alivePlayers = this.game.alivePlayers();
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
            let x = 0;
            while(x<infoTypes.length){
              let chosenInfo = Random.randInt(0, 5);

              switch (chosenSecretType) {
              case 0:
                // Role is in Play
                if(roles.length <= 0) continue;
                let role;
                if(infoTypes [x]){
                role = Random.randArrayVal(currentRoles);
                }
                else{
                role = Random.randArrayVal(roles);
                }

                info [x] = `${role} is Currently in the Game`;
                x = x+1;
                break;
                case 1:
                // Player neighbors Role
                let playerCheck = Random.randArrayVal(alivePlayers);
                let index = alive.indexOf(playerCheck);
                let rightIdx = index+1 % alivePlayers.length;
                let leftIdx = index-1 % alive.length;
                let neighborRoles = [alivePlayers[rightIdx].role,alivePlayers[leftIdx].role];
                let role;
                if(infoTypes [x]){
                role = Random.randArrayVal(neighborRoles);
                }
                else{
                let wrongPlayers = this.game.alivePlayers().filter((p) => p.role != neighborRoles[0]);
                wrongPlayers = wrongPlayers.filter((p) => p.role != neighborRoles[1]);
                role = Random.randArrayVal(wrongPlayers).role;
              
                }

                info [x] = `${playerCheck.name} is Currently neighbors ${role}`;
                x = x+1;
                break;
                case 2:
                // Player Distance
                let playerCheck = Random.randArrayVal(alivePlayers);
                let indexOfTarget = alive.indexOf(playerCheck);
                let rightIdx = index+1 % alivePlayers.length;
                let leftIdx = index-1 % alive.length;
                let leftAlign;
                let rightAlign;
                let distance = 0;
                let found = false;

            for (let y = 0; y < alive.length; y++) {
            leftIdx =
              (indexOfTarget - distance - 1 + alive.length) % alive.length;
            rightIdx = (indexOfTarget + distance + 1) % alive.length;
            leftAlign = alive[leftIdx].role.alignment;
            rightAlign =
              alive[rightIdx].role.alignment;

            if (rightAlign == "Cult" || rightAlign == "Mafia") {
              found = true;
              break;
            } else if (leftAlign == "Cult" || leftAlign == "Mafia") {
              found = true;
              break;
            } else {
              distance = y;
            }
          }

                  
                if(!infoTypes [x]){
                if(distance >0){
                  distance = distance-1;
                }
                  else{
                    distance = distance +1;
                  }
                }

                info [x] = `Their is ${distance} players beetween ${playerCheck.name} and an evil player!`;
                x=x+1;
                break;
                case 3:
                // Dead Evils
                let playersDead = this.game.deadPlayers();
                var evilPlayers = playersDead.filter((p) => p.role.alignment == "Cult" || p.role.alignment == "Mafia");
                let evilCount = evilPlayers.length;
                if(playersDead.length <= 0) continue;
                  
                if(!infoTypes [x]){
                if(evilCount == 0) evilCount = 1;
                else evilCount = evilCount-1;
                }

                info [x] = `${evilCount} Evil Players are dead`;
                x = x+1;
                break;
                case 4:
                // Calulated Famine Death
                if(this.game.famineStarted != true) continue;
                let deathCounter = 0;
                let safe = false;
                for(let player of alivePlayers){
                if (this.player.getImmunity("famine")) continue;
                safe = false;
                  // food items are eaten in this order
                  let foodTypes = ["Food", "Bread", "Orange"];
                  for (let food of foodTypes) {
                    let foodItems = this.player.getItems(food);
                    for (let item of foodItems) {
                      if (!item.cursed) {
                        safe = true;
                        continue;
                      }
                    }
                  }
                  if(!safe){
                    deathCounter = deathCounter+1;
                  }
                }
                  
                if(!infoTypes [x]){
                if(deathCounter > 0){
                  deathCounter = 0;
                }
                else{
                  deathCounter = deathCounter+2;
                }
                }

                info [x] = `${deathCounter} Players have no food for the famine.`;
                x = x+1;
                break;
                case 5:
                // Players have same alignment
                let playerCheck = Random.randArrayVal(alivePlayers);
                let playersNotTarget = alivePlayers.filter((p) => p != playerCheck);
                let playerCheckTwo = Random.randArrayVal(playersNotTarget);
                let relation;
                if(infoTypes [x]){
                if(playerCheck.role.alignment == playerCheckTwo.role.alignment){
                  relation = "Same";
                }
                else{
                  relation = "Diffrent";
                }
                }
                else{
                 if(playerCheck.role.alignment == playerCheckTwo.role.alignment){
                  relation = "Diffrent";
                }
                else{
                  relation = "Same";
                }
                }

                info [x] = `${playerCheck.name} and ${playerCheckTwo.name} have the ${relation} Alignments`;
                x = x+1;
                break;
               }
            }

            info = Random.randomizeArray(info);

            this.actor.queueAlert(`You learn that ${info[0]} OR ${info[1]}`);
          },
        },
      },
    };
  }
};
