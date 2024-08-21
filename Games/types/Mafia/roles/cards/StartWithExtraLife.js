const Card = require("../../Card");

module.exports = class StartWithExtraLife extends Card {
  constructor(role) {
    super(role);

    this.listeners = {
      start: function () {
        this.player.giveEffect("Extra Life");
      },
    };
  }
};
