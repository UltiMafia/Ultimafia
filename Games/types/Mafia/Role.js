const Role = require("../../core/Role");
const MafiaAction = require("./Action");

module.exports = class MafiaRole extends Role {
  constructor(name, player, data) {
    super(name, player, data);

    this.Action = MafiaAction;

    this.appearance = {
      self: "real",
      reveal: "real",
      lynch: "real",
      death: "real",
      investigate: "real",
    };
  }
};
