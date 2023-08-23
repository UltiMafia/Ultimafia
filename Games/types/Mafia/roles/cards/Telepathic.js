const Card = require("../../Card");

module.exports = class Telepathic extends Card {
  constructor(role) {
    super(role);

    this.meetingMods = {
      Village: {
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
