const Card = require("../../Card");
const { PRIORITY_WIN_CHECK_DEFAULT } = require("../../const/Priority");

module.exports = class WinWithEvil extends Card {
  constructor(role) {
    super(role);

    this.winCheck = {
      priority: PRIORITY_WIN_CHECK_DEFAULT,
      check: function (counts, winners, aliveCount) {
        let followerCount = counts["Follower"] || 0;
        let leaderCount = counts["Leader"] || 0;

        const onlyEvil = (leaderCount + followerCount) >= aliveCount && aliveCount > 0;
        if (onlyEvil || this.game.evilWin) {
          winners.addPlayer(this.player, "Evil");
        }
      }
    };
    this.listeners = {
      start: function () {
        let tricksters = this.game.players.filter((p) => p.role.name == "Trickster" && !p.hasEffect("Insanity"));
        let chainsmokers = this.game.players.filter((p) => p.role.name == "Chainsmoker" && !p.hasEffect("Insanity"));

        if (!chainsmokers.length == 0) return;

        for (let player of this.game.players) {
          if (this.player.role.alignment == "Follower"
              && player.role.alignment == "Leader"
              && player != this.player) {
            this.evilReveal(player, "Follower");
          } 
          if (this.player.role.alignment == "Leader"
              && player.role.alignment == "Follower"
              && player != this.player
              && tricksters.length == 0){
            this.evilReveal(player, "Leader");
          }
        } // add learning not in play characters
      },
      death: function (player, killer, deathType, instant) {
        if (player.role.name !== "Chainsmoker") return;
        if (player.hasEffect("Insanity")) return;
        this.data.revealEvilTonight = true;
      },
      state: function (stateInfo){
        if (!this.data.revealEvilTonight) return;
        if (!stateInfo.name.match(/Night/)) return;

        let tricksters = this.game.players.filter((p) => p.role.name == "Trickster" && !p.hasEffect("Insanity"));
        
        for (let player of this.game.players) {
          if (this.player.role.alignment == "Follower"
              && player.role.alignment == "Leader"
              && player != this.player) {
            this.evilReveal(player, "Follower");
          } 
          if (this.player.role.alignment == "Leader"
              && player.role.alignment == "Follower"
              && player != this.player
              && tricksters.length == 0){
            this.evilReveal(player, "Leader");
          }
        }

        this.data.revealEvilTonight = false;
      }
    };
  }
};
