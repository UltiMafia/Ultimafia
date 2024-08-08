const Card = require("../../Card");

module.exports = class StartWithExtraLife extends Card {
  constructor(role) {
    super(role);

    this.listeners = {
      start: function () {

          player.giveEffect("Extra Life");
        
      },
    };
  }
};
