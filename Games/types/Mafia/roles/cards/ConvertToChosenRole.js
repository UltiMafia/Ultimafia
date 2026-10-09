const Card = require("../../Card");
const { PRIORITY_CONVERT_DEFAULT } = require("../../const/Priority");
const { addArticle } = require("../../../../core/Utils");
const { attachConversionPhase } = require("../../const/ConversionPhases");
module.exports = class ConvertToChosenRole extends Card {
  constructor(role) {
    super(role);

    this.meetings = {
      "Select Player": {
        states: ["Night (Converting)"],
        flags: ["voting"],
        targets: { include: ["alive", "self"] },
        action: {
          role: this.role,
          priority: PRIORITY_CONVERT_DEFAULT + 3,
          run: function () {
            this.role.data.targetPlayer = this.target;
          },
        },
      },
      "Convert To": {
        states: ["Night (Converting)"],
        flags: ["voting"],
        inputType: "AllRoles",
        //targets: { targetOptions },
        action: {
          role: this.role,
          labels: ["convert", "role"],
          priority: PRIORITY_CONVERT_DEFAULT + 4,
          run: function () {
            let targetPlayer = this.role.data.targetPlayer;
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

              const wasDemon = this.game.isDemonPlayer(targetPlayer);
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
                  this.game.noteMigoNewDemon(
                    this.actor,
                    targetPlayer,
                    wasDemon
                  );
                }
              } else if (
                this.game.getRoleAlignment(this.target) == "Independent" &&
                targetPlayer.role.alignment == "Independent"
              ) {
                if (this.dominates(targetPlayer)) {
                  targetPlayer.setRole(`${this.target}`);
                  this.game.noteMigoNewDemon(
                    this.actor,
                    targetPlayer,
                    wasDemon
                  );
                }
              }
              delete this.role.data.targetPlayer;
            }
          },
        },
      },
    };
    attachConversionPhase(this, "Night (Converting)");
  }
};
