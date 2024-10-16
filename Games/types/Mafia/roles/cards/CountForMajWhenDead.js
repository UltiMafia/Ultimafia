const Card = require("../../Card");
const Random = require("../../../../../lib/Random");

module.exports = class CountForMajWhenDead extends Card {
  constructor(role) {
    super(role);
    this.role.data.CountForMajWhenDead = true;
    /*
    if (this.role.name == "Devotee") {
      this.role.data.BackUpConvert = true;
    }
    */
  }
};
