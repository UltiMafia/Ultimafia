const Item = require("../Item");

module.exports = class DeadAbilityUser extends Item {
  constructor() {
    super("DeadAbilityUser");
    this.cannotBeStolen = true;
  }
};
