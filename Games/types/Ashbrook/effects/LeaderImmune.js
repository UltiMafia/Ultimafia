const Effect = require("../Effect");

module.exports = class LeaderImmune extends Effect {
  constructor(role) {
    super(role);

    this.immunity["leader"] = 3;
  }
};
