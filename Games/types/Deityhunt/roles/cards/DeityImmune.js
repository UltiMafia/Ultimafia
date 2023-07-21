const Card = require("../../Card");
const { PRIORITY_NIGHT_SAVER } = require("../../const/Priority");

module.exports = class DeityImmune extends Card {
  constructor(role) {
    super(role);

    this.actions = {
      labels: ["absolute", "hidden", "save"],
      priority: PRIORITY_NIGHT_SAVER,
      run: function () {
        this.deityProtect(this.actor);
      }
    }
  };
};
