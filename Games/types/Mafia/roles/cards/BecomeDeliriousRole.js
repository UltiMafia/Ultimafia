const Card = require("../../Card");
const Action = require("../../Action");
const Random = require("../../../../../lib/Random");
const {
  PRIORITY_FULL_DISABLE,
  PRIORITY_ITEM_TAKER_DEFAULT,
} = require("../../const/Priority");
const { roleEquals, roleKey, roleName, roleModifiers } = require("../../../../../lib/roleIdentity");

module.exports = class BecomeDeliriousRole extends Card {
  constructor(role) {
    super(role);

    // Delirium role is chosen only in SwitchRoleBefore when all roles are
    // assigned (avoids wrong/partial pick in closed setup and multiple reveals).
    this.hideModifier = {
      self: true,
      reveal: true,
    };

    this.listeners = {
      SwitchRoleBefore: function (player) {
        if (player != this.player) return;
        switchRoleBefore(this.player.role);
        this.data.reroll = true;
        let role = this.player.addExtraRole(this.player.role.newRole);
        this.giveEffect(this.player, "Delirious", this.player, Infinity, null, this);
        this.player.passiveExtraRoles.push(role);

        /*
        this.player.role.data.reroll = true;
        this.player.holdItem("IsTheBraggart", this.player.role.modifier);
        let tempModifier = this.player.role.modifier;

        this.player.setRole(
          this.player.role.newRole,
          undefined,
          false,
          true,
          false,
          "No Change",
          "RemoveStartingItems"
        );

        let role = this.player.addExtraRole(`${"Villager"}:${tempModifier}`);
        this.player.passiveExtraRoles.push(role);
        */
      },
      roleAssigned: function (player) {
        if (player !== this.player || this.data.reroll) {
          return;
        }
        if (this.hasGainedBraggartRole == true) {
          return;
        }
        this.hasGainedBraggartRole = true;
        if (!this.player.role.newRole) switchRoleBefore(this.player.role);
        let role = this.player.addExtraRole(this.player.role.newRole);
        this.giveEffect(this.player, "Delirious", this.player, Infinity, null, this);
        this.player.passiveExtraRoles.push(role);

        /*
        this.player.holdItem("IsTheBraggart", this.player.role.modifier);
        
        let tempModifier = this.player.role.modifier;
        this.player.setRole(
          this.player.role.newRole,
          undefined,
          false,
          true,
          false,
          "No Change"
        );

        let role = this.player.addExtraRole(`${"Villager"}:${tempModifier}`);
        this.player.passiveExtraRoles.push(role);
        */
      },
      state: function (stateInfo) {
        if (!stateInfo.name.match(/Night/)) {
          return;
        }

        if (
          this.player.effects.filter(
            (e) => e.name == "Delirious" && e.source == this
          ).length <= 0
        ) {
          this.giveEffect(this.player, "Delirious", this.player, Infinity, null, this);
        }

        var action2 = new Action({
          actor: null,
          game: this.player.game,
          role: this,
          priority: PRIORITY_FULL_DISABLE + 1,
          labels: ["block", "hidden"],
          run: function () {
            if (
              this.role.player &&
              this.role.player.effects.filter(
                (e) => e.name == "Delirious" && e.source == this.role
              ).length <= 0
            ) {
              if (this.dominates(this.role.player)) {
                let effect = this.role.giveEffect(
                  this.role.player,
                  "Delirious",
                  this.role.player,
                  Infinity,
                  null,
                  this.role
                );
                this.blockWithDelirium(this.role.player, true);
              }
            }
          },
        });
        this.game.queueAction(action2);

        var action = new Action({
          actor: null,
          game: this.player.game,
          role: this,
          priority: PRIORITY_ITEM_TAKER_DEFAULT + 1,
          labels: ["fixItems", "hidden"],
          run: function () {
            for (let item of this.role.player.items) {
              item.broken = true;
            }
          },
        });
        this.game.queueAction(action);
      },
    };
  }
};

function switchRoleBefore(role) {
  let roles = role.getAllRoles().filter((r) => r);
  let currentRoles = [];
  let playersAll = role.game.players.filter((p) => p.role);
  for (let x = 0; x < playersAll.length; x++) {
    //currentRoles.push(playersAll[x].role);
    currentRoles.push(playersAll[x].role.toRoleData());
  }
  for (let y = 0; y < currentRoles.length; y++) {
    roles = roles.filter(
      (r) => !currentRoles.some((current) => roleEquals(r, current))
    );
  }
  roles = roles.filter(
    (r) => !roleModifiers(r).toLowerCase().includes("banished")
  );
  roles = roles.filter((r) => role.game.getRoleAlignment(roleName(r)) == "Village");
  roles = roles.filter((r) => !roleName(r).toLowerCase().includes("humble"));
  if (roles.length <= 0) {
    roles = currentRoles;
    roles = roles.filter((r) => role.game.getRoleAlignment(roleName(r)) == "Village");
    roles = roles.filter((r) => roleName(r) != "Braggart");
  }
  if (roles.length <= 0) {
    roles = ["Cop"];
  }
  role.newRole = Random.randArrayVal(roles);

  let tempApp = {
    self: roleKey(role.newRole),
    reveal: roleKey(role.newRole),
  };
  role.editAppearance(tempApp);
}
