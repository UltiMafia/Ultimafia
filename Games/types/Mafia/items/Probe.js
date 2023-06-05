const Item = require("../Item");

module.exports = class Probe extends Item {
  constructor() {
    super("Probe");
    this.cannotBeStolen = true;
  }
};
