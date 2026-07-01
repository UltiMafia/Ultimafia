const DailyChallenge = require("../../core/DailyChallenge");

module.exports = class WinFeaturedSetup extends DailyChallenge {
  constructor(name, player) {
    super(name, player);

    this.listeners = {
      aboutToFinish: function () {
        if (!this.game.hasIntegrity || this.game.private) {
          return;
        }
        if (
          !Object.values(this.game.winners.groups)
            .flat()
            .find((p) => p === this.player)
        ) {
          return;
        }
        let setupId;
        for (let Challenge of this.player.user.dailyChallenges) {
          if (Challenge[0] == this.ID) {
            setupId = Challenge[2];
          }
        }
        if (this.game.setup.id == setupId) {
          this.player.DailyPayout += this.reward;
          this.player.DailyCompleted += 1;
          for (let Challenge of this.player.user.dailyChallenges) {
            if (Challenge[0] == this.ID) {
              this.player.user.dailyChallenges.splice(
                this.player.user.dailyChallenges.indexOf(Challenge),
                1
              );
            }
          }
          this.player.CompletedDailyChallenges.push([
            this.ID,
            this.game.setup.name,
          ]);
        }
      },
    };
  }
};
