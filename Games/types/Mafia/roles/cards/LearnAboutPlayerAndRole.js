const Card = require("../../Card");
const Action = require("../../Action");
const { PRIORITY_INVESTIGATIVE_DEFAULT } = require("../../const/Priority");

module.exports = class LearnAboutPlayerAndRole extends Card {
  constructor(role) {
    super(role);

    (this.meetings = {
      "Select Statement": {
        actionName: "Select Relation",
        states: ["Day"],
        flags: ["voting", "instant"],
        inputType: "custom",
        targets: ["(Player) is (Role)", "(Player) neighbors (Role)", "(Player) was visited by (Role) last night", "(Player) visited (Role) last night", "None"],
        action: {
          labels: ["investigate"],
          priority: PRIORITY_INVESTIGATIVE_DEFAULT - 1,
          role: this.role,
          run: function () {
            if(this.target == "None"){
              return;
            }
            this.role.data.targetRelation = this.target;
            let playerAndRole = ["(Player) is (Role)", "(Player) neighbors (Role)", "(Player) was visited by (Role) last night", "(Player) visited (Role) last night"];
            if(playerAndRole.includes(this.target)){
              if(this.role.data.Count == null){
                this.role.data.Count = 0;
              }
              this.role.data.Count += 1;
               let temp = this.actor.holdItem("PlayerButton", this.role.data.Count, this.role);
               this.game.instantMeeting(temp.meetings, [this.actor]);
               let temp2 = this.actor.holdItem("RoleButton", this.role.data.Count, this.role);
               this.game.instantMeeting(temp2.meetings, [this.actor]);
            }
          },
        },
      },
    }),
/*
    (this.meetings = {
      "Select Players": {
        actionName: "Select Player",
        states: ["Day"],
        flags: ["voting", "instant"],
        targets: { include: ["alive", "self"] },
        action: {
          labels: ["investigate", "role"],
          priority: PRIORITY_INVESTIGATIVE_DEFAULT - 2,
          role: this.role,
          run: function () {
            this.role.data.targetPlayer = this.target;
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
          role: this.role,
          run: function () {
            this.role.data.targetRelation = this.target;
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
          role: this.role,
          run: function () {
            this.role.data.targetRole = this.target;
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
          role: this.role,
          run: function () {
            if (this.target === "No") return;

            if (!this.role.data.targetPlayer) return;
            if (!this.role.data.targetRelation) return;
            if (!this.role.data.targetRole) return;
            if (this.role.data.targetPlayer == "No One") return;
            if (this.role.data.targetRole == "None") return;

            let isCorrect = true;
            let question = "";

            let info = this.game.createInformation(
              "PlayerRoleRelationInfo",
              this.actor,
              this.game,
              this.role.data.targetPlayer,
              this.role.data.targetRole,
              this.role.data.targetRelation
            );
            info.processInfo();
            info.getGuessMessages();
            this.actor.queueAlert(`:invest: ${info.getInfoFormated()}`);

         
            delete this.role.data.targetPlayer;
            delete this.role.data.targetRelation;
            delete this.role.data.targetRole;
          },
        },
      },
    }),
     */

      (this.listeners = {
        roleAssigned: function (player) {
          if (player !== this.player) {
            return;
          }

          this.data.ConvertOptions = this.game.PossibleRoles.filter((r) => r);
        },
        questionInfo: function (role){
          if(role != this){
            return;
          }
          if(this.data.targetRelation != null){
          if(this.data.PlayerA != null && this.data.RoleA != null){
          var action = new Action({
          actor: this.player,
          game: this.player.game,
          role: this.role,
          priority: PRIORITY_INVESTIGATIVE_DEFAULT,
          labels: ["investigate"],
          run: function () {
            let info = this.game.createInformation(
              "PlayerRoleRelationInfo",
              this.actor,
              this.game,
              this.role.data.PlayerA,
              this.role.data.RoleA,
              this.role.data.targetRelation
            );
            info.processInfo();
            info.getGuessMessages();
            this.actor.queueAlert(`:invest: ${info.getInfoFormated()}`);

         
            delete this.role.data.targetPlayer;
            delete this.role.data.targetRelation;
            delete this.role.data.targetRole;
          },
        });

        action.do();
          }
          }
        },
      });
      
  }
};
