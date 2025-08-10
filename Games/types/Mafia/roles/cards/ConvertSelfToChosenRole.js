const Card = require("../../Card");
const { PRIORITY_NIGHT_ROLE_BLOCKER } = require("../../const/Priority");
const { addArticle } = require("../../../../core/Utils");
module.exports = class ConvertSelfToChosenRole extends Card {
  constructor(role) {
    super(role);
    
    this.meetings = {
      "Become Role": {
        states: ["Night"],
        flags: ["voting"],
        inputType: "AllRoles",
        AllRolesFilters: ["aligned"],
        //targets: { include: [], exclude: ["aligned"] },
        //targets: { targetOptions },
        action: {
          role: this.role,
          labels: ["convert", "role"],
          priority: PRIORITY_NIGHT_ROLE_BLOCKER+1,
          run: function () {
            if (this.target == "None") return;
            if (!this.dominates(this.actor)) {
              return;
            }
            let targetPlayer = this.actor;
            if (targetPlayer) {
              let players = this.game.players.filter((p) => p.role);
              let currentRoles = [];

              for (let x = 0; x < players.length; x++) {
                currentRoles.push(players[x].role);
              }
              for (let y = 0; y < currentRoles.length; y++) {
                if (this.target.split(":")[0] == currentRoles[y].name) {
                  if (
                    this.game.getRoleAlignment(this.target) != "Independent"
                  ) {
                    players[y].giveEffect("Delirious", this.actor, Infinity, null, this.role);
                    this.blockWithDelirium(players[y], true);
                    break;
                  } else {
                    if (this.dominates(players[y])) {
                      players[y].setRole(`Amnesiac`);
                    }
                  }
                }
              }

              if (
                this.game.getRoleAlignment(this.target) ==
                targetPlayer.role.alignment
              ) {
                targetPlayer.setRole(
                  `${this.target}`,
                  null,
                  false,
                  false,
                  false,
                  "No Change"
                );
              }
              delete this.actor.role.data.targetPlayer;
            }
          },
        },
      },
    };
  }
};
