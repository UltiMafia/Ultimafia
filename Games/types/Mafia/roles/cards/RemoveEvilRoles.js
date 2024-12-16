const Card = require("../../Card");
const Random = require("../../../../../lib/Random");

module.exports = class RemoveEvilRoles extends Card {
  constructor(role) {
    super(role);

    this.listeners = {
      removeRequiredRole: function (player) {
        if (player != this.player) return;
        this.player.role.data.reroll = true;

        let players = this.game.players.filter(
          (p) => p.role.alignment == "Mafia" || p.role.alignment == "Cult"
        );
        let shuffledPlayers = Random.randomizeArray(players);
        let roles = this.game.PossibleRoles.filter((r) => r);
        for (let w = 0; w < players.length; w++) {
          let currentRoles = [];
          let playersAll = this.game.players.filter((p) => p.role);
          for (let x = 0; x < playersAll.length; x++) {
            //currentRoles.push(playersAll[x].role);
            let tempName = playersAll[x].role.name;
            let tempModifier = playersAll[x].role.modifier;
            currentRoles.push(`${tempName}:${tempModifier}`);
          }
          if (this.game.setup.unique) {
            for (let y = 0; y < currentRoles.length; y++) {
              roles = roles.filter(
                (r) => r != currentRoles[y] && !currentRoles[y].includes(r)
              );
            }
          }
          roles = roles.filter(
            (r) => this.game.getRoleAlignment(r) == "Village"
          );

          if (roles.length <= 0) {
            roles = currentRoles.filter(
              (r) => this.game.getRoleAlignment(r) == "Village"
            );
          }

          let newRole = Random.randArrayVal(roles);
          players[w].setRole(newRole, undefined, false, true);
        }
      },
      SwitchRoleBefore: function (player) {
        if (player != this.player) return;
        this.player.role.data.reroll = true;

        let players = this.game.players.filter(
          (p) => p.role.alignment == "Mafia" || p.role.alignment == "Cult"
        );
        let shuffledPlayers = Random.randomizeArray(players);
        let roles = this.game.PossibleRoles.filter((r) => r);
        for (let w = 0; w < players.length; w++) {
          players[w].setRole("Villager", undefined, false, true);
        }
      },
    };
  }
};
