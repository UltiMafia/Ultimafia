const Card = require("../../Card");
const { PRIORITY_CONVERT_DEFAULT } = require("../../const/Priority");
const { addArticle } = require("../../../../core/Utils");

module.exports = class ConvertToChosenRole extends Card {
  constructor(role) {
    super(role);
    this.meetings = {
      "Select Player": {
        states: ["Night"],
        flags: ["voting"],
        targets: { include: ["alive", "self"] },
        action: {
          priority: PRIORITY_CONVERT_DEFAULT - 1,
          run: function () {
            this.actor.role.data.targetPlayer = this.target;
          },
        },
      },
      "Type a Role that can spawn in the Setup (List Role Name Only)": {
        states: ["Night"],
        flags: ["voting"],
        inputType: "text",
        textOptions: {
          minLength: 1,
          maxLength: 50,
          alphaOnly: true,
          toLowerCase: true,
          submit: "Submit",
        },
        action: {
          labels: ["convert", "role"],
          priority: PRIORITY_CONVERT_DEFAULT,
          run: function () {
              this.actor.role.data.targetRoleName = this.target;
        
          },
        },
      },
      "Type any the names of Any Modifers the Role has. (Leave Blank and hit submit if it has No Modifers) ": {
        states: ["Night"],
        flags: ["voting"],
        inputType: "text",
        textOptions: {
          minLength: 0,
          maxLength: 50,
          alphaOnly: true,
          toLowerCase: true,
          submit: "Submit",
        },
        action: {
          labels: ["convert", "role"],
          priority: PRIORITY_CONVERT_DEFAULT,
          run: function () {
              this.actor.role.data.targetRoleName = this.target;

            let roleSelected = this.actor.role.data.targetRoleName;
            let targetPlayer = this.actor.role.data.targetPlayer;
            delete this.actor.role.data.targetPlayer;
            delete this.actor.role.data.targetRoleName;
            let modifersSelected = this.target;
            if (targetPlayer && roleSelected.length > 0) {

              let roleSelected = roleSelected.trim();
              let allRoles = this.game.PossibleRoles.filter((r) => r);
              let matchedRoles = [];

              for(let x = 0; x < allRoles; x++){
                if(allRoles [x].split(":")[0].toLowerCase() == roleSelected.toLowerCase()){
                  matchedRoles.push(allRoles [x]);
                }
              }
              
              let perfectMatch = 0
              for(let x = 0; x < matchedRoles; x++){
              let modifiers = matchedRoles[x].split(":")[1];
              let isPerfect = true;
              if(!modifiers || modifiers.length == 0){
                if(modifersSelected.length <= 1) perfectMatch = matchedRoles[x];
                else isPerfect = false;
              }
              else {
              let modifierNames = modifiers.split("/");
              for(let y = 0; y < modifierNames.length; y++){
                if(!modifersSelected.toLowerCase().includes(modifierNames [y])){
                  isPerfect = false;
                }
              }
              }
                if(isPerfect){
                  perfectMatch = matchedRoles[x];
                }
                if(perfectMatch != 0) break;
              }
              let finalRole;
              if(perfectMatch != 0){
                finalRole = perfectMatch;
              }
              else{
                finalRole = matchedRoles [0];
              }
              
              
              let players = this.game.players.filter((p) => p.role);
              let currentRoles = [];
              
              for (let x = 0; x < players.length; x++) {
                currentRoles.push(players [x].role);
              }
              for(let y = 0; y < currentRoles.length;y++){
                if(finalRole.split(":")[0] == currentRoles[y].name){
                  return;
                }
              }
              
              if (this.game.getRoleAlignment(finalRole) == targetPlayer.role.alignment) {
                    targetPlayer.setRole(`${finalRole}`);
              } 
            }
          },
        },
      },
    };

  }
};
