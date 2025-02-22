const Achievements = require("../Achievements");
const Action = require("../Action");
const { PRIORITY_MODIFY_INVESTIGATIVE_RESULT_DEFAULT } = require("../const/Priority");

module.exports = class LawyerFrame extends Achievements {
  constructor(name, player) {
    super(name, player);

    this.listeners = {
    state: function (stateInfo) {
        if (stateInfo.name.match(/Day/)) {
          this.FramedPlayer = null;
          return;
        }
        if (!stateInfo.name.match(/Night/)) {
          return;
        }
      if(this.player.role.name == "Lawyer"){
        var action = new Action({
          actor: null,
          target: this.player,
          game: this.player.game,
          priority: PRIORITY_MODIFY_INVESTIGATIVE_RESULT_DEFAULT+1,
          labels: ["hidden", "absolute"],
          achievement: this,
          run: function () {
           
              for (let action of this.game.actions[0]) {
              if (
                action.hasLabels(["frame", "alignment", "flip"]) &&
                 action.actor == this.target &&
                action.dominates(action.target, false)
              ) {
                if(this.game.getRoleAlignment(action.target.role.name) == "Village"){
                this.achievement.FramedPlayer = action.target;
                }
                 break;
              }
            }
            
          },
        });

        this.game.queueAction(action);
        }
      },
      Information: function (info) {
        if(this.FramedPlayer == null || this.player.role.name != "Lawyer"){
          return;
        }
        if (
          info.target &&
          info.target == this.FramedPlayer &&
          info.creator &&
          (info.creator.role.name == "Cop" ||
            info.creator.role.name == "Detective")
        ) {
          if (
            info.isUnfavorable() &&
            (info.name == "Binary Alignment Info" || info.name == "Role Info")
          ) {
            this.hasFramed = true;
          }
        }
      },
      aboutToFinish: function () {
        if (this.hasFramed == true) {
          this.player.EarnedAchievements.push("Mafia19");
        }
      },
    };
  }
};
