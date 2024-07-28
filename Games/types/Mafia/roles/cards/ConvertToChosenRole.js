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
      "Type a Role Name from the Setup (No Modifers)": {
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
            let targetPlayer = this.actor.role.data.targetPlayer;
            if (targetPlayer) {

              let roleSelected = this.target.trim();
              roleSelected = roleSelected.toLowerCase();
              
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

        this.listeners = {
      roleAssigned: function (player) {
        if (player !== this.player) {
          return;
        }

        this.data.ConvertOptions = this.game.PossibleRoles.filter((r) => r);

        for(this.data.ConvertOptions )
        
      },
      // refresh cooldown
      state: function (stateInfo) {
        if (!stateInfo.name.match(/Night/)) {
          return;
        }
        var ConvertOptions = this.data.ConvertOptions;

        this.meetings["Convert To"].targets = ConvertOptions;
      },
    };
  }
};
