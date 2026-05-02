const DailyChallenge = require("../../core/DailyChallenge");

module.exports = class PlayLabSetup extends DailyChallenge {
  constructor(name, player) {
    super(name, player);

    this.listeners = {
      aboutToFinish: function () {
        if (!this.game.hasIntegrity || this.game.private) {
          return;
        }
        let setupId;
        for (let Challenge of this.player.user.dailyChallenges) {
          if (Challenge[0] == this.ID) {
            setupId = Challenge[2];
          }
        }
        if (!setupId) return;
        const gameSetupId =
          this.game.setup &&
          this.game.setup._id &&
          this.game.setup._id.toString();
        if (gameSetupId === setupId) {
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
          this.player.CompletedDailyChallenges.push([this.ID, setupId]);
        }
      },
    };
  }
};
