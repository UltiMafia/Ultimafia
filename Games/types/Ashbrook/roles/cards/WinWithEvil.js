const Card = require("../../Card");
const Random = require("../../../../../lib/Random");
const { PRIORITY_WIN_CHECK_DEFAULT } = require("../../const/Priority");

module.exports = class WinWithEvil extends Card {
  constructor(role) {
    super(role);

    this.winCheck = {
      priority: PRIORITY_WIN_CHECK_DEFAULT,
      check: function (counts, winners, aliveCount) {
        let leaderCount = counts["Leader"] || 0;

        const onlyEvilF2 = leaderCount >= 1 && aliveCount <= 2;
        if (onlyEvilF2 || this.game.evilWin) {
          winners.addPlayer(this.player, "Evil");
        }
      }
    };
    this.listeners = {
      start: function () {
        let loudmouths = this.game.players.filter((p) => p.role.name == "Loudmouth" && !p.hasEffect("Insanity"));

        if (this.player.role.alignment == "Leader" ||
          (loudmouths.length !== 0 && 
          this.player.role.alignment == "Follower")){
          let possibleBluffs = this.game.excessRoles["Villager"].concat(this.game.excessRoles["Outcast"]);
          var bluffs = [
            Random.randArrayVal(possibleBluffs, true),
            Random.randArrayVal(possibleBluffs, true),
            Random.randArrayVal(possibleBluffs, true),
          ];
          this.player.queueAlert(`You learn that ${bluffs[0]}, ${bluffs[1]}, and ${bluffs[2]} are not in play!`);
        }

        let chainsmokers = this.game.players.filter((p) => p.role.name == "Chainsmoker" && !p.hasEffect("Insanity"));

        if (chainsmokers.length !== 0) return;

        for (let player of this.game.players) {
          if (this.player.role.alignment == "Follower"
              && (player.role.alignment == "Leader" ||
              player.role.alignment == "Follower")
              && player != this.player) {
            this.evilReveal(player, "Follower");
          } 
          if (this.player.role.alignment == "Leader"
              && player.role.alignment == "Follower"
              && player != this.player){
            this.evilReveal(player, "Leader");
          }
        }
      },
      death: function (player, killer, deathType, instant) {
        if (player.role.name !== "Chainsmoker") return;
        if (player.hasEffect("Insanity")) return;
        this.data.revealEvilTonight = true;
      },
      state: function (stateInfo){
        if (!this.data.revealEvilTonight) return;
        if (!stateInfo.name.match(/Night/)) return;
        
        for (let player of this.game.players) {
          if (this.player.role.alignment == "Follower"
              && player.role.alignment == "Leader"
              && player != this.player) {
            this.evilReveal(player, "Follower");
          } 
          if (this.player.role.alignment == "Leader"
              && player.role.alignment == "Follower"
              && player != this.player){
            this.evilReveal(player, "Leader");
          }
        }

        this.data.revealEvilTonight = false;
      }
    };
  }
};
