const Card = require("../../Card");

module.exports = class CauseFullMoons extends Card {
  constructor(role) {
    super(role);

    this.listeners = {
      state: function (stateInfo) {
        if (!this.hasAbility(["Full Moon"])) {
          return;
        }

        if (
          stateInfo.name.match(/Night/) &&
          parseInt(stateInfo.dayCount) % 2 == 0 &&
          this.game.stateEvents["Full Moon"] != true
        ) {
          this.game.stateEvents["Full Moon"] = true;
        } else if (!stateInfo.name.match(/Dawn/)) {
          this.game.stateEvents["Full Moon"] = false;
        }
      },
    };
  }
};
