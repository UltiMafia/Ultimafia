const Card = require("../../Card");

module.exports = class Humble extends Card {
  constructor(role) {
    super(role);

    this.hideModifier = {
      self: true,
      reveal: true,
    };

    var appearance;
    if (this.role.alignment === "Village") {
      appearance = "Villager";
    } else if (this.role.alignment === "Mafia") {
      appearance = "Mafioso";
    } else if (this.role.alignment === "Cult") {
      appearance = "Cultist";
    } else if (this.role.alignment === "Independent") {
      appearance = "Grouch";
    } else if (this.role.alignment === "Village" && this.role.act) {
      appearance = "Visitor";
    } else if (this.role.alignment === "Mafia" && this.role.act) {
      appearance = "Trespasser";
    } else if (this.role.alignment === "Cult" && this.role.act) {
      appearance = "Werewolf";
    } else if (this.role.alignment === "Independent" && this.role.act) {
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

    if (this.role.alignment === "Independent") {
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
