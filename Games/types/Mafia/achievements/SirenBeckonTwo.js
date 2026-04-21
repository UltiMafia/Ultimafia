const Achievements = require("../Achievements");
const Action = require("../Action");
const { PRIORITY_KILL_SIREN } = require("../const/Priority");

module.exports = class SirenBeckonTwo extends Achievements {
  constructor(name, player) {
    super(name, player);
    this.BeckonedRoles = [];
    this.listeners = {
      state: function (stateInfo) {
        if (!stateInfo.name.match(/Night/)) {
          return;
        }
        if (this.player.role.name == "Siren") {
          var action = new Action({
            actor: null,
            target: this.player,
            game: this.player.game,
            priority: PRIORITY_KILL_SIREN + 1,
            labels: ["hidden", "absolute"],
            achievement: this,
            run: function () {
              for (let action of this.game.actions[0]) {
                if (
                  action.hasLabels(["kill"]) &&
                  action.actor == this.target &&
                  action.dominates(action.target, false)
                ) {
                  if (
                    action.target &&
                    action.target.role &&
                    !this.achievement.BeckonedRoles.includes(
                      action.target.role.name
                    )
                  ) {
                    this.achievement.BeckonedRoles.push(
                      action.target.role.name
                    );
                  }
                  break;
                }
              }
            },
          });

          this.game.queueAction(action);
        }
      },
      aboutToFinish: function () {
        if (!this.player.alive) {
          return;
        }
        if (this.BeckonedRoles.length >= 2) {
          this.player.EarnedAchievements.push("Mafia48");
        }
      },
    };
  }
};
