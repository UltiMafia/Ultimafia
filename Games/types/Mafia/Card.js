const Card = require("../../core/Card");

module.exports = class MafiaCard extends Card {
  constructor(role) {
    super(role);
  }
  editAppearance(newAppearance, newAppearanceMods) {
    let oldAppearance = {
      self: this.role.appearance["self"],
      reveal: this.role.appearance["reveal"],
      condemn: this.role.appearance["condemn"],
      death: this.role.appearance["death"],
      investigate: this.role.appearance["investigate"],
    };
    let oldAppearanceMods = this.role.appearanceMods;
    if (newAppearance != null) {
      this.role.appearance = {
        self:
          newAppearance["self"] != null
            ? newAppearance["self"]
            : oldAppearance["self"],
        reveal:
          newAppearance["reveal"] != null
            ? newAppearance["reveal"]
            : oldAppearance["reveal"],
        condemn:
          newAppearance["condemn"] != null
            ? newAppearance["condemn"]
            : oldAppearance["condemn"],
        death:
          newAppearance["death"] != null
            ? newAppearance["death"]
            : oldAppearance["death"],
        investigate:
          newAppearance["investigate"] != null
            ? newAppearance["investigate"]
            : oldAppearance["investigate"],
      };
    }
    if (newAppearanceMods != null) {
      this.role.appearanceMods = {
        self:
          newAppearanceMods["self"] != null
            ? newAppearanceMods["self"]
            : oldAppearanceMods["self"],
        reveal:
          newAppearanceMods["reveal"] != null
            ? newAppearanceMods["reveal"]
            : oldAppearanceMods["reveal"],
        condemn:
          newAppearanceMods["condemn"] != null
            ? newAppearanceMods["condemn"]
            : oldAppearanceMods["condemn"],
        death:
          newAppearanceMods["death"] != null
            ? newAppearanceMods["death"]
            : oldAppearanceMods["death"],
        investigate:
          newAppearanceMods["investigate"] != null
            ? newAppearanceMods["investigate"]
            : oldAppearanceMods["investigate"],
      };
    }
  }
};
