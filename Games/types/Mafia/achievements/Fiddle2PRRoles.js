const Achievements = require("../Achievements");
const Action = require("../Action");
const { PRIORITY_INVESTIGATIVE_DEFAULT } = require("../const/Priority");

module.exports = class Fiddle2PRRoles extends Achievements {
  constructor(name, player) {
    super(name, player);
    this.FiddleCount = 0;
    this.FiddledRoles = [];
    this.listeners = {
      state: function (stateInfo) {
        if (!stateInfo.name.match(/Night/)) {
          return;
        }
        if (this.player.role.name == "Fiddler" && this.FiddleCount < 2) {
          var action = new Action({
            actor: null,
            target: this.player,
            game: this.player.game,
            priority: PRIORITY_INVESTIGATIVE_DEFAULT,
            labels: ["hidden", "absolute"],
            achievement: this,
            run: function () {
              for (let action of this.game.actions[0]) {
                if (
                  action.hasLabels(["effect", "fiddled"]) &&
                  action.actor == this.target &&
                  action.dominates(action.target, false) &&
                  action.target.alive
                ) {
                  if (
                    this.game.getRoleAlignment(action.target.role.name) ==
                      "Village" &&
                    action.target.role.name != "Villager" &&
                    !this.achievement.FiddledRoles.includes(
                      action.target.role.name
                    )
                  ) {
                    this.achievement.FiddleCount++;
                    this.achievement.FiddledRoles.push(action.target.role.name);
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
        if (this.FiddleCount >= 2) {
          this.player.EarnedAchievements.push("Mafia13");
        }
      },
    };
  }
};
