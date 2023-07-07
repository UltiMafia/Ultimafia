const Item = require("../../core/Item");

module.exports = class MafiaItem extends Item {
  constructor(name, data) {
    super(name, data);
  }

  eat() {}

  get snoopName() {
    return this.name;
  }
};
