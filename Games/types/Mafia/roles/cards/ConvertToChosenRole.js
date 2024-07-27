const Card = require("../../Card");
const { PRIORITY_CONVERT_DEFAULT } = require("../../const/Priority");
const { addArticle } = require("../../../../core/Utils");

module.exports = class ConvertToChosenRole extends Card {
  constructor(role) {
    super(role);
const targetOptions = this.game.PossibleRoles.filter((r) => r)
    this.meetings = {
      "Select Player": {
        states: ["Night"],
        flags: ["voting"],
        action: {
          priority: PRIORITY_CONVERT_DEFAULT - 1,
          run: function () {
            this.actor.role.data.targetPlayer = this.target;
          },
        },
      },
      "Convert To": {
        states: ["Night"],
        flags: ["voting"],
        inputType: "custom",
        targets: { targetOptions },
        action: {
          labels: ["convert", "role"],
          priority: PRIORITY_CONVERT_DEFAULT,
          run: function () {
            let targetPlayer = this.actor.role.data.targetPlayer;
            if (targetPlayer) {
              let players = this.game.players.filter((p) => p.role);
              let currentRoles = [];
              
              for (let x = 0; x < players.length; x++) {
                currentRoles.push(players [x].role);
              }
              for(let y = 0; y < currentRoles.length;y++){
                if(this.target.split(":")[0] == currentRoles[y].name){
                  return;
                }
              }
              
              if (this.game.getRoleAlignment(this.target) == targetPlayer.role.alignment) {
                    targetPlayer.setRole(`${this.target}`);
              } 
              delete this.actor.role.data.targetPlayer;
            }
          },
        },
      },
    };
  }
};
