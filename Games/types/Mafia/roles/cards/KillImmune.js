const Card = require("../../Card");

module.exports = class KillImmune extends Card {
  constructor(role) {
    super(role);

    this.startEffects = [
      {
        type: "Kill Immune",
        args: [5, Infinity],
      },
    ];
  }
};
