const Effect = require("../Effect");

module.exports = class ExtraLife extends Effect {
  constructor() {
    super("Extra Life");

    this.immunity["lynch"] = Infinity;
    this.listeners = {
      immune: function (action) {
        if (action.target === this.player) {
          if (action.hasLabel("kill") &&
              !this.player.role.immunity["kill"] &&
              !this.player.tempImmunity["kill"]) {
              this.remove();
          } else if (action.hasLabel("lynch") &&
              !this.player.role.immunity["lynch"] &&
              !this.player.tempImmunity["lynch"]) {
              this.remove();
          }
        }
      },
    };
  }
};
