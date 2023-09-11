const Card = require("../../Card");

module.exports = class MemberCore extends Card {
  constructor(role) {
    super(role);

    this.meetings = {};
  }
};
