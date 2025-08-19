const Event = require("../Event");
const Action = require("../Action");
const Random = require("../../../../lib/Random");
const roles = require("../../../../data/roles");
const {
  PRIORITY_ITEM_GIVER_DEFAULT,
  PRIORITY_BECOME_DEAD_ROLE,
} = require("../const/Priority");

module.exports = class Evolution extends Event {
  constructor(modifiers, game) {
    super("Evolution", modifiers, game);
  }

  getNormalRequirements() {
    let vanillaPlayers = this.game
      .alivePlayers()
      .filter(
        (p) =>
          p.role.name == "Villager" ||
          p.role.name == "Mafioso" ||
          p.role.name == "Cultist" ||
          p.role.name == "Grouch"
      );
    if (vanillaPlayers.length <= 0) return false;
    return true;
  }

  doEvent() {
    super.doEvent();
    let victim = Random.randArrayVal(this.game.alivePlayers());
    this.action = new Action({
      actor: victim,
      target: victim,
      game: this.game,
      priority: PRIORITY_BECOME_DEAD_ROLE,
      event: this,
      labels: ["hidden", "absolute"],
      run: function () {
        let vanillaPlayers = this.game
          .alivePlayers()
          .filter(
            (p) =>
              (p.role.name == "Villager" ||
                p.role.name == "Mafioso" ||
                p.role.name == "Cultist" ||
                p.role.name == "Grouch") &&
              this.event.canTargetPlayer(p)
          );
        if (vanillaPlayers.length <= 0) return;

        if (this.game.SilentEvents != false) {
          this.game.queueAlert(
            `Event: Evolution, Some Chemicals got spilled into the non-pr role's Drinking water!`
          );
        }
        let victim = Random.randArrayVal(vanillaPlayers);
        const randomAlignedRole = Random.randArrayVal(
          this.game.PossibleRoles.filter(
            (r) => this.game.getRoleAlignment(r) == victim.role.alignment
          )
        );
        victim.setRole(
          randomAlignedRole,
          null,
          false,
          false,
          false,
          "No Change"
        );
      },
    });
    this.game.queueAction(this.action);
  }
};
