const Role = require("../../core/Role");
const AshbrookAction = require("./Action");

module.exports = class AshbrookRole extends Role {
  constructor(name, player, data) {
    super(name, player, data);

    this.Action = AshbrookAction;

    this.appearance = {
      self: "real",
      reveal: "real",
      condemn: "real",
      death: "real",
      investigate: "real",
    };
  }
};
