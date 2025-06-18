const Card = require("../../Card");
const { PRIORITY_KILL_DEFAULT } = require("../../const/Priority");
const { addArticle } = require("../../../../core/Utils");

module.exports = class GuessRoleOrDie extends Card {
  constructor(role) {
    super(role);

    this.meetings = {
      "Choose Player": {
        states: ["Night"],
        flags: ["voting", "mustAct"],
        targets: { include: ["alive", "self", "dead"] },
        action: {
          priority: PRIORITY_KILL_DEFAULT - 1,
          run: function () {
            this.actor.role.data.targetPlayer = this.target;
          },
        },
      },
      "Guess Role": {
        states: ["Night"],
        flags: ["voting", "mustAct"],
        inputType: "AllRoles",
        AllRolesFilters: ["addedRoles"],
        action: {
          labels: ["kill"],
          priority: PRIORITY_KILL_DEFAULT,
          run: function () {
            let targetPlayer = this.actor.role.data.targetPlayer;
            if (targetPlayer) {
              let tempName = targetPlayer.role.name;
              let tempModifier = targetPlayer.role.modifier;
              let playerRole = `${tempName}:${tempModifier}`;
              if (tempModifier) {
                playerRole = `${tempName}:${tempModifier}`;
              } else {
                playerRole = `${tempName}`;
              }

              if (this.target == playerRole || this.target == playerRole) {
                return;
              } else {
                if (this.dominates(this.actor))
                  this.actor.kill("basic", this.actor);
              }

              delete this.actor.role.data.targetPlayer;
            }
          },
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
