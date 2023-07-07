const Item = require("../Item");

module.exports = class Food extends Item {
  constructor(foodType) {
    super("Food");
    this.foodType = foodType;
  }

  get snoopName() {
    return this.foodType;
  }
};
