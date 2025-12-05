const Card = require("../../Card");
const Random = require("../../../../../lib/Random");

module.exports = class BanishedRole extends Card {
  constructor(role) {
    super(role);
     if (role.isExtraRole == true) {
      return;
    }
    this.role.data.banished = true;
  }
};
