const Item = require("../Item");

module.exports = class Hex extends Item {
  constructor() {
    super("Hex");
    this.cannotBeStolen = true;
  }
};
