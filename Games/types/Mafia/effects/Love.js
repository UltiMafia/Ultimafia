const Effect = require("../Effect");

module.exports = class Love extends Effect {
  constructor(matchmaker) {
    super("Love");
    this.matchmaker = matchmaker;
  }
};
