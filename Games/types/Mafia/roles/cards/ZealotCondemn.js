const Card = require("../../Card");
const Random = require("../../../../../lib/Random");
const { PRIORITY_WIN_BY_CONDEMNING } = require("../../const/Priority");

module.exports = class ZealotCondemn extends Card {
  constructor(role) {
    super(role);
    this.target = "";

    this.listeners = {
      Devotion: function (EndangeredPlayer) {
        this.player.role.data.ZealotCondemn = true;
      },
      state: function (stateInfo) {
        if (!this.player.alive) return;
        if (stateInfo.name.match(/Day/)) {
          if (this.player.role.data.ZealotCondemn == true) {
            this.player.queueAlert(
              `After the Death of your beloved master, You Call apon the Dark Gods to Smite the Village. They demand that a Village Aligned player be condemned. If no one is condemned the Dark Gods will Smite your Alignment.`
            );
            this.player.role.data.ZealotDay = true;
          }
        }
        if (stateInfo.name.match(/Night/)) {
          if (this.player.role.data.ZealotDay == true) {
            for (let p of this.game.alivePlayers()) {
              if (p.faction === this.player.faction) {
                p.kill("basic", this.player, true);
              }
            }
          }
        }
      },
      roleAssigned: function (player) {
        if (player !== this.player) {
          return;
        }
        this.player.role.data.ZealotWin = false;
      },
      death: function (player, killer, deathType) {
        if (
          player.faction === "Village" &&
          deathType == "condemn" &&
          this.player.alive &&
          this.player.role.data.ZealotDay == true
        ) {
          this.player.role.data.ZealotWin = true;
        }
      },
    };
  }
};
