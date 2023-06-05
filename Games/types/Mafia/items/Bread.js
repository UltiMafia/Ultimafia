const Item = require("../Item");

module.exports = class Bread extends Item {
  constructor(options) {
    super("Bread");

    this.cursed = options?.cursed;
  }
};
