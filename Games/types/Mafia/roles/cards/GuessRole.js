const Card = require("../../Card");
const { PRIORITY_INVESTIGATIVE_DEFAULT } = require("../../const/Priority");
const { addArticle } = require("../../../../core/Utils");

module.exports = class GuessRole extends Card {
  constructor(role) {
    super(role);

    this.meetings = {
      "Pursue Player": {
        states: ["Night"],
        flags: ["voting"],
        action: {
          labels: ["investigate", "role"],
          priority: PRIORITY_INVESTIGATIVE_DEFAULT,
          role: this.role,
          run: function () {
            //this.actor.role.data.targetPlayer = this.target;
            let targetRole = this.role.data.targetRole;
              if (targetRole) {
              let info = this.game.createInformation(
                "GuessRoleInfo",
                this.actor,
                this.game,
                [this.target],
                [targetRole]
              );
              info.processInfo();

              this.actor.queueAlert(`:invest: ${info.getInfoFormated()}`);
              delete this.role.data.targetRole;
            }
          },
        },
      },
      "Guess Role": {
        states: ["Night"],
        flags: ["voting"],
        inputType: "AllRoles",
        AllRolesFilters: ["addedRoles"],
        action: {
          role: this.role,
          labels: ["investigate", "role"],
          priority: PRIORITY_INVESTIGATIVE_DEFAULT-1,
          run: function () {
            
            this.role.data.targetRole = this.target;
            /*
            let targetPlayer = this.actor.role.data.targetPlayer;

            if (targetPlayer) {
              let info = this.game.createInformation(
                "GuessRoleInfo",
                this.actor,
                this.game,
                [targetPlayer],
                [this.target]
              );
              info.processInfo();

              this.actor.queueAlert(`:invest: ${info.getInfoFormated()}`);
              delete this.actor.role.data.targetPlayer;
              */
            }
          },
        },
      };
    /*
    this.listeners = {
      roleAssigned: function (player) {
        if (player !== this.player) {
          return;
        }

        this.player.role.data.ConvertOptions = this.game.PossibleRoles.filter(
          (r) => r
        );
      },
      // refresh cooldown
      state: function (stateInfo) {
        if (!stateInfo.name.match(/Night/)) {
          return;
        }
        let guessOptions = this.player.role.data.ConvertOptions;
        //ConvertOptions.push("None");

        this.meetings["Guess Role"].targets = guessOptions;
      },
    };
    */
  }
};
