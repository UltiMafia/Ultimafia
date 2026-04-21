const Achievements = require("../Achievements");

module.exports = class LifeguardPRSave extends Achievements {
  constructor(name, player) {
    super(name, player);

    this.listeners = {
      aboutToFinish: function () {
        if (this.player.role.name != "Lifeguard") {
          return;
        }
        const master = this.player.role.data.master;
        if (!master || master == 0) {
          return;
        }
        if (!master.alive) {
          return;
        }
        if (this.game.getRoleAlignment(master.role.name) != "Village") {
          return;
        }
        if (master.role.name == "Villager") {
          return;
        }
        if (
          Object.values(this.game.winners.groups)
            .flat()
            .find((p) => p === this.player)
        ) {
          this.player.EarnedAchievements.push("Mafia41");
        }
      },
    };
  }
};
