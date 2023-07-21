const Effect = require("../Effect");

module.exports = class ExtraLife extends Effect {
  constructor() {
    super("Extra Life");

    this.immunity["kill"] = Infinity;
    this.immunity["condemn"] = Infinity;

    this.listeners = {
      immune: function (action) {
        if (action.target !== this.player) {
          return;
        }

        if (
          action.hasLabel("kill") &&
          !this.player.role.immunity["kill"] &&
          !this.player.tempImmunity["kill"]
        ) {
          this.remove();
          return;
        }

        if (
          action.hasLabel("condemn") &&
          !this.player.role.immunity["condemn"] &&
          !this.player.tempImmunity["condemn"]
        ) {
          this.remove();
          return;
        }
      },
    };
  }
};
