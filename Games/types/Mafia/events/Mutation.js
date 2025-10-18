const Event = require("../Event");
const Action = require("../Action");
const Random = require("../../../../lib/Random");
const modifiers = require("../../../../data/modifiers");
const { PRIORITY_CONVERT_DEFAULT } = require("../const/Priority");
const modBlacklist = ["Clannish", "Exclusive", "Inclusive"];

module.exports = class Mutation extends Event {
  constructor(modifiers, game) {
    super("Mutation", modifiers, game);
  }

  getNormalRequirements() {
    return true;
  }

  doEvent() {
    super.doEvent();
    let victim = Random.randArrayVal(this.game.alivePlayers());
    this.action = new Action({
      actor: victim,
      target: victim,
      game: this.game,
      priority: PRIORITY_CONVERT_DEFAULT + 6,
      labels: ["hidden", "absolute", "convert"],
      event: this,
      run: function () {
        if (this.game.SilentEvents != false) {
          this.game.queueAlert(`Event: Mutation, All players gain a modifier!`);
        }
        for (const player of this.event.generatePossibleVictims()) {
          if (this.dominates(player)) {
            let modifiersToUse = Object.entries(modifiers.Mafia)
              .filter(
                (modifierData) =>
                  !modifierData[1].tags.includes("Starting Item") &&
                  !modBlacklist.includes(modifierData[0])
              )
              .map((modifierData) => modifierData[0]);
            modifiersToUse = modifiersToUse.filter(
              (m) => !this.target.role.modifier.split("/").includes(m)
            );
            if (modifiersToUse.length <= 0) {
              continue;
            }

            let randomModifier = Random.randArrayVal(modifiersToUse);
            let currRoleName = player.role.name;
            let currRoleModifier = player.role.modifier;
            let currRoleData = player.role.data;
            if (!currRoleModifier || currRoleModifier.length <= 0) {
              player.setRole(
                `${currRoleName}:${randomModifier}`,
                currRoleData,
                false,
                false,
                false,
                "No Change",
                "NoStartingItems"
              );
            } else {
              player.setRole(
                `${currRoleName}:${currRoleModifier}/${randomModifier}`,
                currRoleData,
                false,
                false,
                false,
                "No Change",
                "NoStartingItems"
              );
            }
          }
        }
      },
    });
    this.game.queueAction(this.action);
  }
};
