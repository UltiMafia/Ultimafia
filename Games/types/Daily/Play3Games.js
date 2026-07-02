const DailyChallenge = require("../../core/DailyChallenge");

module.exports = class Play3Games extends DailyChallenge {
  constructor(name, player) {
    super(name, player);

    this.listeners = {
      aboutToFinish: function () {
        if (!this.game.hasIntegrity || this.game.private || this.game.ranked) {
          return;
        }
        for (let Challenge of this.player.user.dailyChallenges) {
          if (Challenge[0] == this.ID) {
            Challenge[1] = parseInt(Challenge[1]) + 1;
            if (parseInt(Challenge[1]) >= 3) {
              this.player.DailyPayout += this.reward;
              this.player.DailyCompleted += 1;
              this.player.user.dailyChallenges.splice(
                this.player.user.dailyChallenges.indexOf(Challenge),
                1
              );
              this.player.CompletedDailyChallenges.push([this.ID, ""]);
              return;
            }
          }
        }
      },
    };
  }
};
