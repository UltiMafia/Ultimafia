const Card = require("../../Card");
const Random = require("../../../../../lib/Random");
const AllRoles = require("../../../../../data/roles");
const Action = require("../../Action");
const { PRIORITY_BECOME_DEAD_ROLE } = require("../../const/Priority");

module.exports = class BecomeExcessRole extends Card {
  constructor(role) {
    super(role);
   
    this.listeners = {
      state: function (stateInfo) {
        if (!this.player.hasAbility(["Convert", "Modifier"])) {
          return;
        }

        if (!stateInfo.name.match(/Night/)) {
          return;
        }

        var action = new Action({
          actor: this.player,
          game: this.player.game,
          role: this,
          priority: PRIORITY_BECOME_DEAD_ROLE,
          labels: ["convert"],
          run: function () {
            let roles = this.role.getAllRoles().filter((r) => r);
            let players = this.game.players.filter((p) => p.role);
            let currentRoles = [];

            for (let x = 0; x < players.length; x++) {
              currentRoles.push(players[x].role);
            }
            for (let y = 0; y < currentRoles.length; y++) {
              roles = roles.filter(
                (r) =>
                  r.split(":")[0] != currentRoles[y].name &&
                  (this.game.getRoleAlignment(r) ==
                    this.game.getRoleAlignment(this.actor.role.name) ||
                    this.game.getRoleAlignment(this.actor.role.name) ==
                      "Independent")
              );
            }
            if (roles.length <= 0) {
              roles = Object.entries(AllRoles.Mafia)
                .filter(
                  (roleData) =>
                    roleData[1].alignment ===
                    this.game.getRoleAlignment(this.actor.role.name)
                )
                .map((roleData) => roleData[0]);
            }

            let newRole = Random.randArrayVal(roles);

            this.actor.setRole(
              newRole,
              undefined,
              false,
              false,
              false,
              "No Change"
            );
          },
        });

        this.game.queueAction(action);
      },
    };
  }
};
