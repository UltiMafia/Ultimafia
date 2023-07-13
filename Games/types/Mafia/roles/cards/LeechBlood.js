const Card = require("../../Card");
const { PRIORITY_KILL_DEFAULT } = require("../../const/Priority");

module.exports = class LeechBlood extends Card {
  constructor(role) {
    super(role);

    let bloodCount = 0;
    this.meetings = {
      Leech: {
        states: ["Night"],
        flags: ["voting"],
        action: {
          labels: ["blood"],
          priority: PRIORITY_KILL_DEFAULT,
          run: function () {
            this.target.data.blood -= 50;
            bloodCount += 50;
            this.actor.data.blood = Math.min(this.actor.data.blood + 50, 100);
            this.actor.queueAlert(
              `After leeching your target, you now have ${this.actor.data.blood}% blood left!`
            );
            this.target.queueAlert(
              `You now have ${this.target.data.blood}% blood left!`
            );
            if (this.target.data.blood <= 0) {
              this.target.kill("blood", this.actor);
            }
            if (bloodCount >= 150) {
              this.actor.giveEffect("ExtraLife");
              this.actor.queueAlert(
                "You gain an extra life after leeching 150% blood!"
              );
              bloodCount -= 150;
            }
          },
        },
      },
    };

    this.listeners = {
      death: function (player, killer, deathType) {
        if (
          killer === this.player &&
          player !== this.player &&
          deathType !== "condemn"
        ) {
          bloodCount += 50;
        }
      },
    };
  }
};
