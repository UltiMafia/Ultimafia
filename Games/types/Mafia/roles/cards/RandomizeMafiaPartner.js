const Card = require("../../Card");
const { PRIORITY_CONVERT_DEFAULT } = require("../../const/Priority");
const roles = require("../../../../../data/roles");
const Random = require("../../../../../lib/Random");

module.exports = class RandomizeMafiaPartner extends Card {
  constructor(role) {
    super(role);

    this.meetings = {
      Retrain: {
        states: ["Night"],
        flags: ["voting"],
        targets: { include: ["Mafia"], exclude: ["self"] },
        role: this.role,
        action: {
          role: this.role,
          labels: ["convert"],
          priority: PRIORITY_CONVERT_DEFAULT + 3,
          run: function () {
            /*
            const randomMafiaRole = Random.randArrayVal(
              Object.entries(roles.Mafia)
                .filter((roleData) => roleData[1].alignment === "Mafia")
                .map((roleData) => roleData[0])
            );
            */
            const randomMafiaRole = Random.randArrayVal(
              this.role
                .getAllRoles()
                .filter((r) => this.game.getRoleAlignment(r) == "Mafia")
            );
            this.target.setRole(
              randomMafiaRole,
              null,
              false,
              false,
              false,
              "No Change"
            );
          },
        },
      },
    };
  }
};
