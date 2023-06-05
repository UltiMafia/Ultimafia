const Role = require("../../core/Role");

module.exports = class ResistanceRole extends Role {
  constructor(name, player, data) {
    super(name, player, data);

    this.appearance = {
      self: "real",
      reveal: "real",
    };
  }
};
