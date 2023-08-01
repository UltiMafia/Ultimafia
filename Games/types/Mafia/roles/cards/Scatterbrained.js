const Card = require("../../Card");

module.exports = class Scatterbrained extends Card {
  constructor(role) {
    super(role);

    this.hideModifier = {
      self: true,
      reveal: true,
    };

    var appearance;
    if (this.role.alignment === "Village") {
      appearance = "Visitor";
    } else if (this.role.alignment === "Mafia") {
      appearance = "Trespasser";
    } else if (this.role.alignment === "Cult") {
      appearance = "Werewolf";
    } else if (
      this.role.alignment === "Independent" ||
      this.role.alignment === "Hostile"
    ) {
      appearance = "Fool";
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

    if (
      this.role.alignment === "Independent" ||
      this.role.alignment === "Hostile"
    ) {
      this.meetingMods["*"] = {
        actionName: "Fool Around",
      };
    }

    if (this.role.alignment === "Monsters") {
      this.meetingMods["*"] = {
        actionName: "Wolf Bite",
      };
    }
  }
};
