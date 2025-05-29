const Item = require("../Item");
const Action = require("../Action");
const { PRIORITY_EFFECT_GIVER_DEFAULT } = require("../const/Priority");

module.exports = class Garbage extends Item {
  constructor(garbageType) {
    super("Garbage");
    this.garbageType = garbageType;
  }

  get snoopName() {
    return this.garbageType;
  }
};
