const Achievements = require("../Achievements");

module.exports = class Scumhunter extends Achievements {
  constructor(name, player) {
    super(name, player);

    this.EvilVotesCount = 0;
    this.listeners = {
      vote: function (vote) {
        if (vote.voter != this.player) {
          return;
        }
        let target;
        for (let player of this.game.players) {
          if (vote.target == player.id) {
            target = player;
          }
        }
        if (target == null) {
          this.isVotingEvil = false;
          return;
        }
        if (vote.meeting.name === "Village" && vote.voter === this.player) {
          if (target.isEvil() && this.player.role.name == "Villager") {
            this.isVotingEvil = true;
          } else {
            this.isVotingEvil = false;
          }
        }
      },
      afterActions: function () {
        if (this.isVotingEvil == true) {
          this.isVotingEvil = false;
          this.EvilVotesCount++;
        }
      },
      aboutToFinish: function () {
        if (this.isVotingEvil == true) {
          this.isVotingEvil = false;
          this.EvilVotesCount++;
        }

        if (this.EvilVotesCount >= 3) {
          this.player.EarnedAchievements.push("Mafia5");
        }
      },
    };
  }
};
