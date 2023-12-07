const Card = require("../../Card");
const { PRIORITY_CONVERT_DEFAULT } = require("../../const/Priority");
const roles = require("../../../../../data/roles");
const Random = require("../../../../../lib/Random");

module.exports = class RandomizeCultPartner extends Card {
  constructor(role) {
    super(role);

    this.meetings = {
      "Transmute": {
        states: ["Night"],
        flags: ["voting"],
        targets: { include: ["Cult"], exclude: ["self"] },
        action: {
            labels: ["convert"],
            priority: PRIORITY_CONVERT_DEFAULT,
            run: function () {
            const randomCultRole = Random.randArrayVal(
              Object.entries(roles.Cult)
                .filter((roleData) => roleData[1].alignment === "Cult")
                .map((roleData) => roleData[0])
            );
            this.target.setRole(randomCultRole);
          },
        },
      },
    };
  }
};
