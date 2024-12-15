const Card = require("../../Card");
const { PRIORITY_CONVERT_DEFAULT } = require("../../const/Priority");
const { addArticle } = require("../../../../core/Utils");
module.exports = class HostChooseRoles extends Card {
  constructor(role) {
    super(role);
    //const targetOptions = this.game.PossibleRoles.filter((r) => r);
    ///const playerCount = this.game.players.length;

    this.meetings = {
      "Choose Players": {
        states: ["Dusk", "Dawn"],
        flags: ["voting", "multi"],
        multiMin: 0,
        multiMax: 50,
        targets: { include: ["alive", "dead"] },
        shouldMeet: function () {
          return this.hasBeenDusk != true;
        },
        action: {
          priority: PRIORITY_CONVERT_DEFAULT - 1,
          run: function () {
            this.actor.role.data.targetPlayer = this.target;
          },
        },
      },
      "Convert To": {
        states: ["Dusk", "Dawn"],
        flags: ["voting", "multi"],
        multiMin: 0,
        multiMax: 50,
        inputType: "custom",
        //targets: { ["e"] },
        shouldMeet: function () {
          return this.hasBeenDusk != true;
        },
        action: {
          labels: ["role", "hidden", "absolute"],
          priority: PRIORITY_CONVERT_DEFAULT,
          run: function () {
            let targetPlayer = [];
            this.hasBeenDusk == true;
            if (!this.actor.role.data.targetPlayer) return;

            this.actor.role.data.targetRole = this.target;
          },
        },
      },
      "Confirm Selections": {
        states: ["Dawn", "Dusk"],
        flags: ["voting"],
        inputType: "boolean",
        shouldMeet: function () {
          return this.hasBeenDusk != true;
        },
        action: {
          labels: ["investigate"],
          priority: PRIORITY_CONVERT_DEFAULT + 1,
          run: function () {
            if (this.target === "No") return;

            if(!this.actor.role.data.targetPlayer) return;
            if(!this.actor.role.data.targetRole) return;

            let correctCount = 0;

            let playerSize = this.actor.role.data.targetPlayer.length;
            let roleSize = this.actor.role.data.targetRole.length;
            let validSize;
            if (roleSize > playerSize) {
              validSize = playerSize;
            } else {
              validSize = roleSize;
            }

            let targetPlayer;
            let targetRole;
            for (let x = 0; x < validSize; x++) {
              targetPlayer = this.actor.role.data.targetPlayer[x];
              targetRole = this.actor.role.data.targetRole[x];
              if (targetPlayer && targetRole) {
                targetPlayer.setRole(`${targetRole}`);
                this.actor.queueAlert(
                  `:invest: You convert ${targetPlayer.name} to ${targetRole}.`
                );
              }
            }
            delete this.actor.role.data.targetPlayer;
            delete this.actor.role.data.targetRole;
          },
        },
      },
    };

    this.listeners = {
      roleAssigned: function (player) {
        if (player !== this.player) {
          return;
        }
        this.hasBeenDusk = false
        this.data.ConvertOptions = this.game.PossibleRoles.filter((r) => r);
      },
      // refresh cooldown
      state: function (stateInfo) {
        if(stateInfo.name.match(/Day/) || stateInfo.name.match(/Night/)){
          this.hasBeenDusk = true;
        }
        if (stateInfo.name.match(/Dusk/) || stateInfo.name.match(/Dawn/)) {
          var ConvertOptions = this.data.ConvertOptions;
          this.meetings["Convert To"].targets = ConvertOptions;
        }
      },
    };
  }
};
