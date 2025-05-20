const Card = require("../../Card");
const modifiers = require("../../../../../data/modifiers");
const { PRIORITY_CONVERT_DEFAULT } = require("../../const/Priority");
const modBlacklist = ["Clannish", "Exclusive", "Inclusive"]

module.exports = class AddRandomModifier extends Card {
  constructor(role) {
    super(role);


    this.meetings = {
      "Give Modifers": {
        states: ["Night"],
        flags: ["voting"],
        action: {
          labels: ["convert"],
          priority: PRIORITY_CONVERT_DEFAULT-1,
          run: function () {
            if (!this.dominates()) {
              return;
            }
            let modifiers = Object.entries(modifiers.Mafia).filter((modifierData) => (!modifierData[1].tags.includes("Items") || modifierData[0] == "Apprehensive") && !modBlacklist.includes(modifierData[0])).map((modifierData) => modifierData[0]);
            modifiers = modifiers.filter((m) => this.target.role.modifier.split("/").includes(m));
              let randomModifier = Random.randArrayVal(modifiers);

            let currRoleName = this.target.role.name;
            let currRoleModifier = this.target.role.modifier;
            let currRoleData = this.target.role.data;

            this.target.setRole(`${currRoleName}:${currRoleModifier}/${randomModifier}`, currRoleData,
              true,
              true,
              true,
              "No Change", "NoStartingItems");
          },
        },
      },
    };
  }
};
