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
        action: {
          labels: ["convert"],
          priority: PRIORITY_CONVERT_DEFAULT,
          run: function () {
            const randomMafiaRole = Random.randArrayVal(
              Object.entries(roles.Mafia)
                .filter((roleData) => roleData[1].alignment === "Mafia")
                .map((roleData) => roleData[0])
            );
            this.target.setRole(randomMafiaRole);
          },
        },
      },
    };
  }
};
