const Card = require("../../Card");
const { PRIORITY_CONVERT_DEFAULT } = require("../../const/Priority");
const roles = require("../../../../../data/roles");
const Random = require("../../../../../lib/Random");

module.exports = class RandomizeCultPartner extends Card {
  constructor(role) {
    super(role);

    this.meetings = {
      Transmute: {
        states: ["Night"],
        flags: ["voting"],
        targets: { include: ["Cult"], exclude: ["self"] },
        action: {
          role: this.role,
          labels: ["convert"],
          priority: PRIORITY_CONVERT_DEFAULT+3,
          run: function () {
            /*
            const randomCultRole = Random.randArrayVal(
              Object.entries(roles.Mafia)
                .filter((roleData) => roleData[1].alignment === "Cult")
                .map((roleData) => roleData[0])
            );
            */
            const randomCultRole = Random.randArrayVal(this.role.getAllRoles().filter((r) => this.game.getRoleAlignment(r) == "Cult"));
            this.target.setRole(
              randomCultRole,
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
