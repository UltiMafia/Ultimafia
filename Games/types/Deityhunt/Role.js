const Role = require("../../core/Role");
const DeityhuntAction = require("./Action");

module.exports = class DeityhuntRole extends Role {
  constructor(name, player, data) {
    super(name, player, data);

    this.Action = DeityhuntAction;

    this.appearance = {
      self: "real",
      reveal: "real",
      condemn: "real",
      death: "real",
      investigate: "real",
    };
  }
};
