const Hellhound = require("/Hostile/Hellhound");

module.exports = class TheThing extends Hellhound {
  constructor(player, data) {
    super("The Thing", player, data);
  }
};
