const Card = require("../../Card");
const Action = require("../../Action");
const Random = require("../../../../../lib/Random");

module.exports = class BecomeUndercoverEvil extends Card {
  constructor(role) {
    super(role);

    let banishedRoles = this.game.banishedRoles;
    let roles = this.game.PossibleRoles.filter((r) => r);
    let currentRoles = [];
    let playersAll = this.game.players.filter((p) => p.role);
    for (let x = 0; x < playersAll.length; x++) {
      //currentRoles.push(playersAll[x].role);
      let tempName = playersAll[x].role.name;
      let tempModifier = playersAll[x].role.modifier;
      currentRoles.push(`${tempName}:${tempModifier}`);
    }
      roles = roles.filter((r) => !currentRoles.includes(r));
    
    roles = roles.filter((r) => !(r.toLowerCase().includes("demonic")));
    roles = roles.filter((r) => !(r.toLowerCase().includes("linchpin")));
    roles = roles.filter(
      (r) =>
        this.game.getRoleAlignment(r) == "Mafia" ||
        this.game.getRoleAlignment(r) == "Cult"
    );
    if (roles.length <= 0) {
      roles = currentRoles;
      roles = roles.filter((r) => !r.toLowerCase().includes("demonic"));
      roles = roles.filter((r) => !r.toLowerCase().includes("linchpin"));
      roles = roles.filter(
        (r) =>
          this.game.getRoleAlignment(r) != "Village" &&
          this.game.getRoleAlignment(r) != "Independent"
      );
    }
    if (roles.length <= 0) {
      roles = ["Mafioso"];
    }
    role.newRole = Random.randArrayVal(roles);

    this.listeners = {
      SwitchRoleBefore: function (player) {
        if (player != this.player) return;
        switchRoleBefore(this.player.role);

        if (this.player.faction == null) {
          this.player.faction = "Village";
        }

        this.player.role.data.reroll = true;
        this.player.holdItem("IsTheMole", this.player.faction);

        this.action = new Action({
          actor: this.player,
          target: this.player,
          game: this.game,
          labels: ["hidden", "block"],
          run: function () {
            let evilPlayers = this.game.players.filter(
              (p) =>
                p.role.alignment ==
                this.game.getRoleAlignment(this.actor.role.newRole)
            );

            for (let x = 0; x < evilPlayers.length; x++) {
              evilPlayers[x].queueAlert(
                `There is a Mole Amoungst your ranks! You may attempt to guess the mole once.`
              );
              evilPlayers[x].holdItem("MoleVoting");
            }
            this.actor.holdItem("MoleVoting");
            this.actor.queueAlert(
              `You are the Mole, You have the abilites of a ${this.actor.role.newRole}`
            );
          },
        });

        this.action.do();

        this.player.setRole(
          this.player.role.newRole,
          undefined,
          false,
          true,
          false,  null, null, "RemoveStartingItems"
        );
        let tempApp = {
          self: "Mole",
        };
        this.editAppearance(tempApp);
        this.player.role.revealToSelf(true);
        this.game.graveyardParticipation = true;
      },
      roleAssigned: function (player) {
        if (player !== this.player) {
          return;
        }
        this.player.holdItem("IsTheMole", this.player.faction);
        this.player.setRole(this.player.role.newRole, undefined, false, true, false);
        let tempApp = {
          self: "Mole",
        };
        this.editAppearance(tempApp);
        this.player.role.revealToSelf(true);
      },
    };
  }



};

function switchRoleBefore(role){
  
    let roles = role.game.PossibleRoles.filter((r) => r);
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
    roles = roles.filter((r) => !(r.toLowerCase().includes("demonic")));
    roles = roles.filter((r) => !(r.toLowerCase().includes("linchpin")));
    roles = roles.filter(
      (r) =>
        role.game.getRoleAlignment(r) == "Mafia" ||
        role.game.getRoleAlignment(r) == "Cult"
    );
    if (roles.length <= 0) {
      roles = currentRoles;
      roles = roles.filter((r) => !r.toLowerCase().includes("demonic"));
      roles = roles.filter((r) => !r.toLowerCase().includes("linchpin"));
      roles = roles.filter(
        (r) =>
          role.game.getRoleAlignment(r) != "Village" &&
          role.game.getRoleAlignment(r) != "Independent"
      );
    }
    if (roles.length <= 0) {
      roles = ["Mafioso"];
    }
    role.newRole = Random.randArrayVal(roles);
}