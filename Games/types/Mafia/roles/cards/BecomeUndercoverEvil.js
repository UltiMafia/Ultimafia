const Card = require("../../Card");
const Action = require("../../Action");
const Random = require("../../../../../lib/Random");
const { roleEquals, roleName, roleModifiers, normalizeRole } = require("../../../../../lib/roleIdentity");

module.exports = class BecomeUndercoverEvil extends Card {
  constructor(role) {
    super(role);

    let banishedRoles = this.game.banishedRoles;
    let roles = this.role.getAllRoles().filter((r) => r);
    let currentRoles = [];
    let playersAll = this.game.players.filter((p) => p.role);
    for (let x = 0; x < playersAll.length; x++) {
      //currentRoles.push(playersAll[x].role);
      currentRoles.push(playersAll[x].role.toRoleData());
    }
    roles = roles.filter(
      (r) => !currentRoles.some((current) => roleEquals(r, current))
    );

    roles = roles.filter(
      (r) =>
        !roleName(r).toLowerCase().includes("demonic") &&
        !roleModifiers(r).toLowerCase().includes("demonic")
    );
    roles = roles.filter(
      (r) =>
        !roleName(r).toLowerCase().includes("vital") &&
        !roleModifiers(r).toLowerCase().includes("vital")
    );
    roles = roles.filter(
      (r) =>
        this.game.getRoleAlignment(roleName(r)) == "Mafia" ||
        this.game.getRoleAlignment(roleName(r)) == "Cult"
    );
    if (roles.length <= 0) {
      roles = currentRoles;
      roles = roles.filter(
        (r) =>
          !roleName(r).toLowerCase().includes("demonic") &&
          !roleModifiers(r).toLowerCase().includes("demonic")
      );
      roles = roles.filter(
        (r) =>
          !roleName(r).toLowerCase().includes("vital") &&
          !roleModifiers(r).toLowerCase().includes("vital")
      );
      roles = roles.filter(
        (r) =>
          this.game.getRoleAlignment(roleName(r)) != "Village" &&
          this.game.getRoleAlignment(roleName(r)) != "Independent"
      );
    }
    if (roles.length <= 0) {
      roles = [normalizeRole("Mafioso")];
    }
    role.newRole = Random.randArrayVal(roles);

    this.listeners = {
      SwitchRoleBefore: function (player) {
        if (player != this.player) return;
        switchRoleBefore(this);

        if (this.player.faction == null) {
          this.player.faction = "Village";
        }

        this.data.reroll = true;
        this.player.holdItem("IsTheMole", this.player.faction);

        this.action = new Action({
          actor: this.player,
          target: this.player,
          game: this.game,
          labels: ["hidden", "block"],
          role: this,
          run: function () {
            let evilPlayers = this.game.players.filter(
              (p) =>
                p.role.alignment ==
                this.game.getRoleAlignment(roleName(this.actor.role.newRole))
            );

            for (let x = 0; x < evilPlayers.length; x++) {
              evilPlayers[x].queueAlert(
                `There is a Mole Amoungst your ranks! You may attempt to guess the mole once.`
              );
              evilPlayers[x].holdItem("MoleVoting");
            }
            this.actor.holdItem("MoleVoting");
            this.actor.queueAlert(
              `You are the Mole, You have the abilities of a ${roleName(this.role.newRole)}`
            );
          },
        });

        this.action.do();

        this.player.setRole(
          this.newRole,
          undefined,
          false,
          true,
          false,
          null,
          null,
          "RemoveStartingItems"
        );
        let tempApp = {
          self: "Mole",
        };
        this.editAppearance(tempApp);
        this.player.role.revealToSelf(true);
        this.game.setGraveyardParticipation(true);
      },
      roleAssigned: function (player) {
        if (player !== this.player) {
          return;
        }
        this.player.holdItem("IsTheMole", this.player.faction);
        this.player.setRole(this.newRole, undefined, false, true, false);
        let tempApp = {
          self: "Mole",
        };
        this.editAppearance(tempApp);
        this.player.role.revealToSelf(true);
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
    (r) =>
      !roleName(r).toLowerCase().includes("demonic") &&
      !roleModifiers(r).toLowerCase().includes("demonic")
  );
  roles = roles.filter(
    (r) =>
      !roleName(r).toLowerCase().includes("vital") &&
      !roleModifiers(r).toLowerCase().includes("vital")
  );
  roles = roles.filter(
    (r) =>
      role.game.getRoleAlignment(roleName(r)) == "Mafia" ||
      role.game.getRoleAlignment(roleName(r)) == "Cult"
  );
  if (roles.length <= 0) {
    roles = currentRoles;
    roles = roles.filter(
      (r) =>
        !roleName(r).toLowerCase().includes("demonic") &&
        !roleModifiers(r).toLowerCase().includes("demonic")
    );
    roles = roles.filter(
      (r) =>
        !roleName(r).toLowerCase().includes("vital") &&
        !roleModifiers(r).toLowerCase().includes("vital")
    );
    roles = roles.filter(
      (r) =>
        role.game.getRoleAlignment(roleName(r)) != "Village" &&
        role.game.getRoleAlignment(roleName(r)) != "Independent"
    );
  }
  if (roles.length <= 0) {
    roles = [normalizeRole("Mafioso")];
  }
  role.newRole = Random.randArrayVal(roles);
}
