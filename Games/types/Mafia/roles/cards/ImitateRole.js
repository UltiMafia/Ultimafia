const Card = require("../../Card");
const { PRIORITY_INVESTIGATIVE_DEFAULT } = require("../../const/Priority");

module.exports = class ImitateRole extends Card {
  constructor(role) {
    super(role);

    this.meetings = {
      "Imitate Role": {
        states: ["Night"],
        flags: ["voting"],
        inputType: "custom",
        action: {
          labels: ["investigate", "role"],
          priority: PRIORITY_INVESTIGATIVE_DEFAULT,
          run: function () {
            this.actor.role.appearance.reveal = this.target;
            this.actor.role.appearance.condemn = this.target;
            this.actor.role.appearance.death = this.target;
            this.actor.role.appearance.investigate = this.target;
          },
        },
      },
    };
    this.listeners = {
      roleAssigned: function (player) {
        if (player !== this.player) return;

        let roles = [];
        let uniqueRoles = [];
        
        for (let player of this.game.players) {
          let role = player.role.name;
          if (role === "Villager" || role === "Impersonator" || role === "Imposter") return;
          roles.push(role);
        }
        roles.forEach((role) => { if (!uniqueRoles.includes(role)) { uniqueRoles.push(role); } });
        this.meetings["Imitate Role"].targets = uniqueRoles;
      },
    };
  }
};
