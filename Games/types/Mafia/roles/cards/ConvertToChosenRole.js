const Card = require("../../Card");
const { PRIORITY_CONVERT_DEFAULT } = require("../../const/Priority");
const { addArticle } = require("../../../../core/Utils");
module.exports = class ConvertToChosenRole extends Card {
  constructor(role) {
    super(role);
    //const targetOptions = this.game.PossibleRoles.filter((r) => r);
    this.meetings = {
      "Select Player": {
        states: ["Night"],
        flags: ["voting"],
        targets: { include: ["alive", "self"] },
        action: {
          priority: PRIORITY_CONVERT_DEFAULT + 3,
          run: function () {
            this.actor.role.data.targetPlayer = this.target;
          },
        },
      },
      "Convert To": {
        states: ["Night"],
        flags: ["voting"],
        inputType: "custom",
        //targets: { targetOptions },
        action: {
          labels: ["convert", "role"],
          priority: PRIORITY_CONVERT_DEFAULT + 4,
          run: function () {
            let targetPlayer = this.actor.role.data.targetPlayer;
            if (targetPlayer) {
              let players = this.game.players.filter((p) => p.role);
              let currentRoles = [];

              for (let x = 0; x < players.length; x++) {
                currentRoles.push(players[x].role);
              }
              for (let y = 0; y < currentRoles.length; y++) {
                if (
                  this.target.split(":")[0] ==
                  this.game.formatRoleInternal(
                    currentRoles[y].name,
                    currentRoles[y].modifier
                  )
                ) {
                  return;
                }
              }

              if (
                this.game.getRoleAlignment(this.target) != "Independent" &&
                targetPlayer.role.alignment != "Independent"
              ) {
                if (this.dominates(targetPlayer)) {
                  targetPlayer.setRole(
                    `${this.target}`,
                    null,
                    false,
                    false,
                    false,
                    "No Change"
                  );
                }
              } else if (
                this.game.getRoleAlignment(this.target) == "Independent" &&
                targetPlayer.role.alignment == "Independent"
              ) {
                if (this.dominates(targetPlayer)) {
                  targetPlayer.setRole(`${this.target}`);
                }
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
