const Effect = require("../Effect");

module.exports = class Snowstorm extends Effect {
  constructor(lifespan) {
    super("Snowstorm");
    this.lifespan = lifespan ?? 1;
  }

  shouldDisableMeeting(name) {
    return name !== "Snowstorm";
  }

  age() {
    const stateInfo = this.game.getStateInfo();
    if (stateInfo.name.match(/Night/)) {
      this.player.queueAlert(
        ":sy8b: You're snowed in for the night... you cannot take any action!"
      );
    }
    super.age();
  }
};
