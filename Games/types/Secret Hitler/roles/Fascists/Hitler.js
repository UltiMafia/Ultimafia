const Role = require("../../Role");

module.exports = class Fascist extends Role {
  constructor(player, data) {
    super("Hitler", player, data);
    this.alignment = "Fascists";
    this.cards = ["GameCore"];
  }
};