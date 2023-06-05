const Card = require("../../Card");

module.exports = class Scatterbrained extends Card {
  constructor(role) {
    super(role);

    this.hideModifier = {
      self: true,
      reveal: true,
    };

    var appearance;
    if (this.role.alignment === "Village" || this.role.winCount === "Village") {
      appearance = "Visitor";
    } else if (this.role.alignment === "Mafia") {
      appearance = "Trespasser";
    }

    if (!appearance) {
      return;
    }

    this.appearance = {
      self: appearance,
      reveal: appearance,
    };

    this.meetingMods = {
      "*": {
        actionName: "Visit",
      },
      Mafia: {
        actionName: "Mafia Kill",
      },
      Village: {
        actionName: "Village Vote",
      },
    };
  }
};
