const Card = require("../../Card");
const Random = require("../../../../../lib/Random");

module.exports = class CountForMajWhenDead extends Card {
  constructor(role) {
    super(role);
    this.role.data.CountForMajWhenDead = true;
  }
};
