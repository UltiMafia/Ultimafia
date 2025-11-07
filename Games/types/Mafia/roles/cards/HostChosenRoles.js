const Card = require("../../Card");
const { PRIORITY_CONVERT_DEFAULT } = require("../../const/Priority");
const { addArticle } = require("../../../../core/Utils");
module.exports = class HostChooseRoles extends Card {
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
              this.game.events.emit("roleAssigned", player));
            }
          }
        },
      },
    ];

    this.listeners = {
      state: function (stateInfo) {
        if (stateInfo.name.match(/Hosting/) || stateInfo.name.match(/Night/)) {
          this.game.HaveHostingState = false;
        }
      },
    };
  }
};
