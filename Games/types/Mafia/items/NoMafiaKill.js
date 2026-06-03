const Item = require("../Item");

module.exports = class NoMafiaKill extends Item {
  constructor() {
    super("NoMafiaKill");

    this.cannotBeStolen = true;
    this.cannotBeSnooped = true;
    this.lifespan = Infinity;
  }

  shouldDisableMeeting(name) {
    return name.endsWith(" Kill");
  }
};
