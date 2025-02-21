const Card = require("../../Card");
const { PRIORITY_NIGHT_ROLE_BLOCKER } = require("../../const/Priority");
const Action = require("../../Action");
const { addArticle } = require("../../../../core/Utils");
module.exports = class MindRotRoleFor3Nights extends Card {
  constructor(role) {
    super(role);

    //const targetOptions = this.game.PossibleRoles.filter((r) => r);
    this.meetings = {
      "Block Role": {
        states: ["Night"],
        flags: ["voting"],
        inputType: "custom",
        //targets: { targetOptions },
        shouldMeet: function () {
          return !this.hasBlocked;
        },
        action: {
          labels: ["block", "role"],
          priority: PRIORITY_NIGHT_ROLE_BLOCKER - 1,
          run: function () {
            if (this.target == "None") return;
            this.actor.role.hasBlocked = true;
            //this.playersToBlock = [];

            let players = this.game.players.filter((p) => p.role);
            let currentRoles = [];

            for (let x = 0; x < players.length; x++) {
              //currentRoles.push(players[x].role);
              let tempName = players[x].role.name;
              let tempModifier = players[x].role.modifier;
              let playerRole = `${tempName}:${tempModifier}`;
              if (tempModifier) {
                playerRole = `${tempName}:${tempModifier}`;
              } else {
                playerRole = `${tempName}`;
              }
              currentRoles.push(playerRole);
            }
            for (let y = 0; y < currentRoles.length; y++) {
              if (this.target == currentRoles[y]) {
                players[y].giveEffect("Delirious", this.actor, 3);
                this.blockWithDelirium(players[y], true);
                this.actor.role.playersToBlock.push(players[y]);
                //this.actor.role.blockCounter = 3;
              }
            }
          },
        },
      },
    };
    /*
    this.actions = [
      {
        priority: PRIORITY_NIGHT_ROLE_BLOCKER,
        labels: ["block"],
        run: function () {
          //if(!this.actor.role.playersToBlock) return;
          let victims = this.actor.role.playersToBlock;
          if (victims.length <= 0) return;
          if (this.actor.role.blockCounter <= 0) return;
          if (!this.actor.alive) return;
          if (
            this.game.getStateName() == "Day" ||
            this.game.getStateName() == "Dusk"
          )
            this.actor.role.blockCounter = this.actor.role.blockCounter - 1;

          for (let x = 0; x < victims.length; x++) {
            if (this.dominates(victims[x])) {
              this.blockWithDelirium(victims[x]);
            }
          }
        },
      },
    ];
*/
    this.listeners = {
      roleAssigned: function (player) {
        if (player !== this.player) {
          return;
        }
        this.player.role.playersToBlock = [];
        this.player.role.data.blockOptions = this.game.PossibleRoles.filter(
          (r) => r
        );
      },
      // refresh cooldown
      state: function (stateInfo) {
        if (!stateInfo.name.match(/Night/)) {
          return;
        }
        let blockOptions = this.player.role.data.blockOptions.filter((r) => r);
        blockOptions.push("None");

        this.meetings["Block Role"].targets = blockOptions;
      },
    };
  }
};
