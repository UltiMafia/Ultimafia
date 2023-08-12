const Card = require("../../Card");

module.exports = class Telepathic extends Card {
  constructor(player, data) {
    super("Telepathic", player, data);

    this.meetingMods = {
      "*": {
        speechAbilities: [
          {
            name: "Contact",
            targetsDescription: { include: ["members"], exclude: ["self"] },
            targetType: "player",
            verb: "",
          },
        ],
      },
    };
  }
};
