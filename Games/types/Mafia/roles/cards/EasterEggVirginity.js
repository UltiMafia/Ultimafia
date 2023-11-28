const Card = require("../../Card");
const Action = require("../../Action");
const { PRIORITY_CONVERT_DEFAULT } = require("../../const/Priority");

module.exports = class EasterEggVirginity extends Card {
  constructor(role) {
    super(role);

      this.actions = [
        {
          priority: PRIORITY_CONVERT_DEFAULT,
          labels: ["hidden"],
          run: function () {
            if (this.target.role.name === "Virgin"
            ) {
              this.target.setRole("Villager");
            }
          },
        },
      ];
  }
};
