const Card = require("../../Card");
const Action = require("../../Action");
const Random = require("../../../../../lib/Random");
const {
  PRIORITY_FULL_DISABLE,
  PRIORITY_ITEM_TAKER_DEFAULT,
} = require("../../const/Priority");

module.exports = class BecomeDeliriousRole extends Card {
  constructor(role) {
    super(role);

    //this.startItems = ["IsTheBraggart"];

    let banishedRoles = this.game.banishedRoles;
    let roles = this.role.getAllRoles().filter((r) => r);
    let currentRoles = [];
    let playersAll = this.game.players.filter((p) => p.role);
    for (let x = 0; x < playersAll.length; x++) {
      //currentRoles.push(playersAll[x].role);
      let tempName = playersAll[x].role.name;
      let tempModifier = playersAll[x].role.modifier;
      currentRoles.push(`${tempName}:${tempModifier}`);
    }
    for (let y = 0; y < currentRoles.length; y++) {
      roles = roles.filter(
        (r) => r != currentRoles[y] && !currentRoles[y].includes(r)
      );
    }
    roles = roles.filter((r) => !r.toLowerCase().includes("banished"));
    roles = roles.filter((r) => this.game.getRoleAlignment(r) == "Village");
    roles = roles.filter((r) => !r.toLowerCase().includes("humble"));
    if (roles.length <= 0) {
      roles = currentRoles;
      roles = roles.filter((r) => this.game.getRoleAlignment(r) == "Village");
      roles = roles.filter((r) => r.split(":")[0] != "Braggart");
    }
    if (roles.length <= 0) {
      roles = ["Cop"];
    }
    role.newRole = Random.randArrayVal(roles);

    let tempApp = {
      self: role.newRole,
      reveal: role.newRole,
    };
    this.editAppearance(tempApp);

    this.listeners = {
      SwitchRoleBefore: function (player) {
        if (player != this.player) return;
        switchRoleBefore(this.player.role);
        this.data.reroll = true;
        let role = this.player.addExtraRole(this.player.role.newRole);
        this.giveEffect(player, "Delirious", Infinity, this);
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
        let role = this.player.addExtraRole(this.player.role.newRole);
        this.giveEffect(player, "Delirious", Infinity, this);
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
          this.giveEffect(this.player, "Delirious", Infinity, this);
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
    let tempName = playersAll[x].role.name;
    let tempModifier = playersAll[x].role.modifier;
    currentRoles.push(`${tempName}:${tempModifier}`);
  }
  for (let y = 0; y < currentRoles.length; y++) {
    roles = roles.filter(
      (r) => r != currentRoles[y] && !currentRoles[y].includes(r)
    );
  }
  roles = roles.filter((r) => !r.toLowerCase().includes("banished"));
  roles = roles.filter((r) => role.game.getRoleAlignment(r) == "Village");
  roles = roles.filter((r) => !r.toLowerCase().includes("humble"));
  if (roles.length <= 0) {
    roles = currentRoles;
    roles = roles.filter((r) => role.game.getRoleAlignment(r) == "Village");
    roles = roles.filter((r) => r.split(":")[0] != "Braggart");
  }
  if (roles.length <= 0) {
    roles = ["Cop"];
  }
  role.newRole = Random.randArrayVal(roles);

  let tempApp = {
    self: role.newRole,
    reveal: role.newRole,
  };
  role.editAppearance(tempApp);
}
