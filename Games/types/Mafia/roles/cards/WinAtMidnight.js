const Card = require("../../Card");
const { PRIORITY_WIN_CHECK_DEFAULT } = require("../../const/Priority");

module.exports = class WinAtMidnight extends Card {
  constructor(role) {
    super(role);

    role.data.clock = 6;

    this.winCheck = {
      priority: PRIORITY_WIN_CHECK_DEFAULT,
      check: function (counts, winners, aliveCount) {
        if (this.data.clock === 0 || (aliveCount <= 2 && this.player.alive)) {
          winners.addPlayer(this.player, this.name);
        }
      },
    };

    this.listeners = {
      death: function (player, killer, deathType, instant) {
        if (
          deathType !== "lynch" &&
          killer === this.player &&
          player !== this.player
        ) {
          let delta;
          switch (player.role.alignment) {
            case "Village":
              delta = 1;
              break;
            case "Mafia":
            case "Cult":
              delta = 2;
              break;
            default:
              delta = -3;
          }
          this.data.clock = (((this.data.clock + delta) % 12) + 12) % 12;
          let alert = `The clock strikes ${
            this.data.clock === 0 ? "midnight" : this.data.clock
          }.`;
          if (instant) this.player.sendAlert(alert);
          else this.player.queueAlert(alert);

          if (this.data.clock === 3) {
            this.player.kill(deathType, this.player, instant);
          }

          if (this.data.clock === 9) {
            this.player.giveEffect("Extra Life");
            let alert =
              "Your watch glows with power, granting you an extra life!";
            if (instant) this.player.sendAlert(alert);
            else this.player.queueAlert(alert);
          }
        }
      },
    };
  }
};
