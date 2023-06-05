const Item = require("../Item");

module.exports = class Gasoline extends Item {
  constructor() {
    super("Gasoline");
    this.cannotBeStolen = true;
  }
};
