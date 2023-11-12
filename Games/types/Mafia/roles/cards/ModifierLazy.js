const Card = require("../../Card");
const { PRIORITY_SUNSET_DEFAULT } = require("../../const/Priority");

module.exports = class ModifierLazy extends Card {
  constructor(role) {
    super(role);

    this.stateMods = {
      Night: {
        type: "delayActions",
        delayActions: true,
      },
    };
  }
};
