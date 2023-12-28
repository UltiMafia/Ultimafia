const Card = require("../../Card");

module.exports = class StartWithEnvelope extends Card {
  constructor(role) {
    super(role);

    this.startItems = ["Envelope"];
  }
};
