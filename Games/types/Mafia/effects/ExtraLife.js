const Effect = require("../Effect");

module.exports = class ExtraLife extends Effect {
  constructor() {
    super("Extra Life");

    this.immunity["kill"] = Infinity;
    this.listeners = {
      immune: function (action) {
        if (
          action.target === this.player &&
          action.hasLabel("kill") &&
          !this.player.role.immunity["kill"] &&
          !this.player.tempImmunity["kill"]
        ) {
          this.remove();
        }
      },
    };
  }
};
