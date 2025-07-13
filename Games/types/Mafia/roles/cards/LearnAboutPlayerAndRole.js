const Card = require("../../Card");
const Action = require("../../Action");
const { PRIORITY_INVESTIGATIVE_DEFAULT } = require("../../const/Priority");

module.exports = class LearnAboutPlayerAndRole extends Card {
  constructor(role) {
    super(role);

    (this.meetings = {
      "Select Players": {
        actionName: "Select Player",
        states: ["Day"],
        flags: ["voting", "instant"],
        targets: { include: ["alive", "self"] },
        action: {
          labels: ["investigate", "role"],
          priority: PRIORITY_INVESTIGATIVE_DEFAULT - 2,
          run: function () {
            this.actor.role.data.targetPlayer = this.target;
          },
        },
      },
      "Select Relation": {
        actionName: "Select Relation",
        states: ["Day"],
        flags: ["voting", "instant"],
        inputType: "custom",
        targets: ["Is", "Neighbors", "Was Visited By", "Has Visited"],
        action: {
          labels: ["investigate"],
          priority: PRIORITY_INVESTIGATIVE_DEFAULT - 1,
          run: function () {
            this.actor.role.data.targetRelation = this.target;
          },
        },
      },
      "Select Role": {
        actionName: "Select Role",
        states: ["Day"],
        flags: ["voting", "instant"],
        inputType: "AllRoles",
        AllRolesFilters: ["addedRoles"],
        action: {
          labels: ["investigate", "role"],
          priority: PRIORITY_INVESTIGATIVE_DEFAULT - 1,
          run: function () {
            this.actor.role.data.targetRole = this.target;
          },
        },
      },
      "Ask Question": {
        states: ["Day"],
        flags: ["voting", "instant"],
        inputType: "boolean",
        action: {
          labels: ["investigate"],
          priority: PRIORITY_INVESTIGATIVE_DEFAULT,
          run: function () {
            if (this.target === "No") return;

            if (!this.actor.role.data.targetPlayer) return;
            if (!this.actor.role.data.targetRelation) return;
            if (!this.actor.role.data.targetRole) return;
            if (this.actor.role.data.targetPlayer == "No One") return;
            if (this.actor.role.data.targetRole == "None") return;

            let isCorrect = true;
            let question = "";

            let info = this.game.createInformation(
              "PlayerRoleRelationInfo",
              this.actor,
              this.game,
              this.actor.role.data.targetPlayer,
              this.actor.role.data.targetRole,
              this.actor.role.data.targetRelation
            );
            info.processInfo();
            info.getGuessMessages();
            this.actor.queueAlert(`:invest: ${info.getInfoFormated()}`);

         
            delete this.actor.role.data.targetPlayer;
            delete this.actor.role.data.targetRelation;
            delete this.actor.role.data.targetRole;
          },
        },
      },
    }),
     

      (this.listeners = {
        roleAssigned: function (player) {
          if (player !== this.player) {
            return;
          }

          this.data.ConvertOptions = this.game.PossibleRoles.filter((r) => r);
        },
      });
      
  }
};
