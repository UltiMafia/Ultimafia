const Card = require("../../Card");
const modifiers = require("../../../../../data/modifiers");
const { PRIORITY_CONVERT_DEFAULT } = require("../../const/Priority");
const Random = require("../../../../../lib/Random");
const modBlacklist = ["Clannish", "Exclusive", "Inclusive"];

module.exports = class AddRandomModifier extends Card {
  constructor(role) {
    super(role);


    this.meetings = {
      "Give Modifers": {
        states: ["Night"],
        flags: ["voting"],
        action: {
          labels: ["convert"],
          priority: PRIORITY_CONVERT_DEFAULT+6,
          run: function () {
            if (!this.dominates()) {
              return;
            }
            let modifiersToUse = Object.entries(modifiers.Mafia).filter((modifierData) => (!modifierData[1].tags.includes("Items") || modifierData[0] == "Apprehensive") && !modBlacklist.includes(modifierData[0])).map((modifierData) => modifierData[0]);
            modifiersToUse = modifiersToUse.filter((m) => !this.target.role.modifier.split("/").includes(m));
            if(modifiersToUse.length <= 0){
              return;
            }
            let randomModifier = Random.randArrayVal(modifiersToUse);
            let currRoleName = this.target.role.name;
            let currRoleModifier = this.target.role.modifier;
            let currRoleData = this.target.role.data;
            if(!currRoleModifier || currRoleModifier.length <= 0){
            this.target.setRole(`${currRoleName}:${randomModifier}`, currRoleData,
              false,
              false,
              false,
              "No Change", "NoStartingItems");
            }
            else{
            this.target.setRole(`${currRoleName}:${currRoleModifier}/${randomModifier}`, currRoleData,
              false,
              false,
              false,
              "No Change", "NoStartingItems");
            }
          },
        },
      },
    };
  }
};
