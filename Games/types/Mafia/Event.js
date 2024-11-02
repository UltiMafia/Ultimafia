const Effect = require("../../core/Event");

module.exports = class MafiaEvent extends Event {
  constructor(name, game, data) {
    super(name, game, data);
  }
};
