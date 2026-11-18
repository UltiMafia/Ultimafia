const Card = require("../../Card");
const modifiers = require("../../../../../data/modifiers");
const { PRIORITY_CONVERT_DEFAULT } = require("../../const/Priority");
const Random = require("../../../../../lib/Random");
const modBlacklist = ["Clannish", "Exclusive", "Inclusive"];
const { roleWith } = require("../../../../../lib/roleIdentity");

module.exports = class AddRandomModifier extends Card {
  constructor(role) {
    super(role);

    this.meetings = {
      "Give Modifers": {
        states: ["Night"],
        flags: ["voting"],
        action: {
          labels: ["convert"],
          priority: PRIORITY_CONVERT_DEFAULT + 6,
          run: function () {
            if (!this.dominates()) {
              return;
            }
            let modifiersToUse = Object.entries(modifiers.Mafia)
              .filter(
                (modifierData) =>
                  (!modifierData[1].tags.includes("Starting Item") ||
                    modifierData[0] == "Apprehensive") &&
                  !modBlacklist.includes(modifierData[0])
              )
              .map((modifierData) => modifierData[0]);
            const roleIdentity = this.target.role.toRoleData();
            modifiersToUse = modifiersToUse.filter(
              (m) => !roleIdentity.modifiers.includes(m)
            );
            modifiersToUse = modifiersToUse.filter((m) => {
              const allowed = modifiers.Mafia[m].roles;
              return !allowed || allowed.includes(this.target.role.name);
            });
            if (modifiersToUse.length <= 0) {
              return;
            }
            let randomModifier = Random.randArrayVal(modifiersToUse);
            const modifiedRole = roleWith(roleIdentity, {
              modifiers: [...roleIdentity.modifiers, randomModifier],
            });
            let currRoleData = this.target.role.data;
            this.target.setRole(
              modifiedRole,
              currRoleData,
              false,
              false,
              false,
              "No Change",
              "NoStartingItems"
            );
          },
        },
      },
    };
  }
};
