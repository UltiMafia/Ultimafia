const Card = require("../../Card");
const { PRIORITY_CONVERT_DEFAULT } = require("../../const/Priority");
const { addArticle } = require("../../../../core/Utils");
module.exports = class HostChosenRoles extends Card {
  constructor(role) {
    super(role);
    //const targetOptions = this.game.PossibleRoles.filter((r) => r);
    ///const playerCount = this.game.players.length;

    this.meetings = {
      "Confirm Selections": {
        states: ["Hosting"],
        flags: ["voting"],
        inputType: "boolean",
        action: {
          labels: ["investigate"],
          priority: PRIORITY_CONVERT_DEFAULT + 1,
          run: function () {
            if (this.target === "No") return;
          },
        },
      },
    };

    this.passiveActions = [
      {
        actor: role.player,
        state: "Hosting",
        game: role.game,
        role: role,
        priority: PRIORITY_CONVERT_DEFAULT+2,
        labels: ["investigate"],
        run: function () {
          if(this.game.HostRolesChanges){
            for(let player of this.game.HostRolesChanges){
              this.game.events.emit("roleAssigned", player);
            }
          }
        },
      },
    ];

    this.listeners = {
      state: function (stateInfo) {
        if (stateInfo.name.match(/Hosting/)) {
          this.game.HaveHostingState = false;
          if (this.game.isDayStart()){
            this.game.HaveHostingStateBlock = "Day";
          }
          else{
            this.game.HaveHostingStateBlock = "Night";
          }
        }
        if(stateInfo.name.match(/Night/) && this.game.HaveHostingStateBlock == "Night"){
          this.game.HaveHostingStateBlock = null;
        }
        if(stateInfo.name.match(/Day/) && this.game.HaveHostingStateBlock == "Day"){
          this.game.HaveHostingStateBlock = null;
        }
      },
    };

    this.stateMods = {
      Day: {
        type: "shouldSkip",
        shouldSkip: function () {
          if (this.game.HaveHostingState == true) {
            return true;
          }
          if (this.game.HaveHostingStateBlock == "Night") {
            return true;
          }
          return false;
        },
      },
      Night: {
        type: "shouldSkip",
        shouldSkip: function () {
          if (this.game.HaveHostingState == true) {
            return true;
          }
          if (this.game.HaveHostingStateBlock == "Day") {
            return true;
          }
          return false;
        },
      },
    };


  }
};
