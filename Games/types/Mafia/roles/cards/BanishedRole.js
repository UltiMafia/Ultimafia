const Card = require("../../Card");
const Random = require("../../../../../lib/Random");

module.exports = class BanishedRole extends Card {
  constructor(role) {
    super(role);
    this.role.data.banished = true;
  }
};
