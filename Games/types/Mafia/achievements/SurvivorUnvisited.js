const Achievements = require("../Achievements");

module.exports = class SurvivorUnvisited extends Achievements {
  constructor(name, player) {
    super(name, player);

    this.listeners = {
      actionsNext: function (actions) {
        if (this.player.role.name != "Survivor") {
          return;
        }
        if (this.WasVisited) {
          return;
        }
        for (let action of actions || []) {
          if (
            action.target === this.player &&
            action.actor &&
            action.actor !== this.player &&
            !action.hasLabel("hidden")
          ) {
            this.WasVisited = true;
            break;
          }
        }
      },
      aboutToFinish: function () {
        if (this.player.role.name != "Survivor") {
          return;
        }
        if (this.WasVisited) {
          return;
        }
        if (
          Object.values(this.game.winners.groups)
            .flat()
            .find((p) => p === this.player)
        ) {
          this.player.EarnedAchievements.push("Mafia66");
        }
      },
    };
  }
};
