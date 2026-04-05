const Item = require("../Item");

module.exports = class GoldenTicket extends Item {
  constructor() {
    super("Golden Ticket");
    this.lifespan = 1;
    this.cannotBeStolen = true;
    this.cannotBeSnooped = true;
  }
};