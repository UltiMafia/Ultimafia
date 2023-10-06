const Role = require("../../Role");
const Random = require("../../../../../lib/Random");
const Utils = require("../../../../core/Utils");

module.exports = class Werewolf extends Role {
  constructor(player, data) {
    super("Werewolf", player, data);

    this.alignment = "Werewolves";
    this.cards = ["VillageCore", "RevealSameRole", "WinWithWerewolves"];
    this.actions = [
      {
        priority: -100,
        run: function () {
          if (this.game.getStateName() != "Night") return;

          for (let player of this.game.players)
            if (player != this.actor && player.role.name == "Werewolf") return;

          var excessRoleIndex = Random.randInt(
            0,
            this.game.excessRoles.length - 1
          );
          var excessRole = this.game.excessRoles[excessRoleIndex];

          this.actor.queueAlert(
            `${excessRole} is the ${Utils.numToPos(
              excessRoleIndex + 1
            )} excess role.`
          );
        },
      },
    ];
  }
};
