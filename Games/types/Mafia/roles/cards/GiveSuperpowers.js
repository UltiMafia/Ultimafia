const Card = require("../../Card");
const Random = require("../../../../../lib/Random");
const { PRIORITY_INVESTIGATIVE_DEFAULT } = require("../../const/Priority");
const { PRIORITY_SWAP_ROLES } = require("../../const/Priority");

module.exports = class GiveSuperpowers extends Card {
  constructor(role) {
    super(role);

    this.dayShorten = 0;
this.actions = [
      {
        priority: PRIORITY_INVESTIGATIVE_DEFAULT,
        run: function () {
          if (!this.actor.alive) return;
          if (this.game.getStateName() != "Dusk") return;

          let teammates = this.game.players.filter(
            (p) =>
              this.game.getRoleAlignment(p.getRoleName()) == "Independent" &&
              !this.game
                .getRoleTags(
                  this.game.formatRoleInternal(p.getRoleName(), p.role.modifier)
                )
                .includes("Lone")
          );

          for (let v = 0; v < teammates.length; v++) {
            teammates
              .filter((p) => p)
              [v].holdItem("WackyJoinFactionMeeting", this.actor.role.name);
          }
        },
      }];
    
/*
    this.actions = [
      {
        priority: PRIORITY_INVESTIGATIVE_DEFAULT,
        run: function () {
          if (!this.actor.alive) return;
          if (this.game.getStateName() != "Dusk") return;

          let teammates = this.game.players.filter(
            (p) =>
              this.game.getRoleAlignment(p.getRoleName()) == "Independent" &&
              !this.game
                .getRoleTags(
                  this.game.formatRoleInternal(p.getRoleName(), p.role.modifier)
                )
                .includes("Lone")
          );

          for (let v = 0; v < teammates.length; v++) {
            teammates
              .filter((p) => p)
              [v].holdItem("WackyJoinFactionMeeting", this.actor.role.name);
          }

          let randomNumber = Random.randInt(1, 7);
          //let randomNumber = 5;
          let targetTypes = ["neighbors", "even", "odd"];
          let targetType = Random.randArrayVal(targetTypes);

          let roles = this.game.PossibleRoles.filter((r) => r);
          let players = this.game.players.filter((p) => p.role);
          let currentRoles = [];

          for (let x = 0; x < players.length; x++) {
            currentRoles.push(players[x].role);
          }
          for (let y = 0; y < currentRoles.length; y++) {
            roles = roles.filter(
              (r) => r.split(":")[0] != currentRoles[y].name
            );
          }

          switch (randomNumber) {
            case 1:
              for (let player of teammates) {
                player.queueAlert(
                  `A ${this.actor.role.name} has Granted your team the Ability to have Each Member learn a player's role.`
                );
                player.holdItem("WackyRoleLearner", targetType, "Night");
              }
              return;
              break;
            case 2:
              for (let player of teammates) {
                player.queueAlert(
                  `A ${this.actor.role.name} has Granted your team the Ability to reveal a player's role to the Team.`
                );
                player.holdItem(
                  "WackyFactionRoleReveal",
                  `Reveal to Independent`
                );
              }
              return;
              break;
            case 3:
              let info = this.game.createInformation(
                "ExcessRolesInfo",
                this.actor,
                this.game,
                1,
                false
              );
              info.processInfo();
              for (let player of teammates) {
                player.queueAlert(
                  `A ${this.actor.role.name} has Granted your team the Ability to learn 1 Excess Role.`
                );
                var alert = `:invest: ${
                  this.actor.role.name
                } Lets ${info.getInfoFormated()}.`;
                player.queueAlert(alert);
              }
              return;
              break;
            case 4:
              for (let player of teammates) {
                if (
                  this.game.getRoleAlignment(player.role.name) == "Independent"
                ) {
                  player.queueAlert(
                    `A ${this.actor.role.name} has Granted your team an Ability the does Nothing!`
                  );
                }
              }
              return;
              break;
            case 5:
              for (let player of teammates) {
                player.queueAlert(
                  `A ${this.actor.role.name} has Granted your team an Ability that makes all Team member give their role to the closest team member below them on the list at the end of the night! (Looping around at the bottem)`
                );
              }
              this.actor.role.data.swapFaction = "Right";

              return;
              break;
            case 6:
              for (let player of teammates) {
                player.queueAlert(
                  `A ${this.actor.role.name} has Granted your team an Ability that makes all Team member give their role to the closest team member above them on the list at the end of the night! (Looping around at the Top)`
                );
              }
              this.actor.role.data.swapFaction = "Left";

              return;
              break;
            case 7:
              for (let player of teammates) {
                player.queueAlert(
                  `A ${this.actor.role.name} has Granted your team the Ability to learn Eachothers roles!`
                );
                for (let p of teammates) {
                  player.role.revealToPlayer(p);
                }
              }
              return;
              break;
          }
        },
      },
      {
        priority: PRIORITY_SWAP_ROLES - 1,
        run: function () {
          if (this.game.getStateName() != "Night") return;
          if (
            this.actor.role.data.swapFaction != "Left" &&
            this.actor.role.data.swapFaction != "Right"
          )
            return;

          let teammates = this.game.players.filter(
            (p) =>
              this.game.getRoleAlignment(p.role.name) == "Independent" &&
              !this.game
                .getRoleTags(
                  this.game.formatRoleInternal(p.role.name, p.role.modifier)
                )
                .includes("Lone") &&
              p.alive
          );
          //var indexOfActor = players.indexOf(this.actor);
          //let leftIndex = (indexOfActor - 1 + players.length) % players.length;
          //let rightIdx = (indexOfActor + 1) % players.length;
          let tempRole;
          let tempMod;
          let tempData;
          if (this.actor.role.data.swapFaction == "Right") {
            this.actor.role.data.swapFaction = null;
            for (let x = 0; x < teammates.length; x++) {
              if (x == 0) {
                tempRole = teammates[x].role.name;
                tempMod = teammates[x].role.modifier;
                tempData = teammates[x].role.data;
              }
              if (x != teammates.length - 1) {
                teammates[x].setRole(
                  `${teammates[x + 1].role.name}:${
                    teammates[x + 1].role.modifier
                  }`,
                  teammates[x + 1].role.data,
                  false,
                  false,
                  true,
                  "No Change"
                );
              } else {
                teammates[x].setRole(
                  `${tempRole}:${tempMod}`,
                  tempData,
                  false,
                  false,
                  true,
                  "No Change"
                );
              }
            }
          }

          if (this.actor.role.data.swapFaction == "Left") {
            this.actor.role.data.swapFaction = null;
            for (let x = 0; x < teammates.length; x++) {
              if (x == 0) {
                tempRole = teammates[teammates.length - 1 - x].role.name;
                tempMod = teammates[teammates.length - 1 - x].role.modifier;
                tempData = teammates[teammates.length - 1 - x].role.data;
              }
              if (x != teammates.length - 1) {
                teammates[teammates.length - 1 - x].setRole(
                  `${teammates[teammates.length - 1 - x - 1].role.name}:${
                    teammates[teammates.length - 1 - x - 1].role.modifier
                  }`,
                  teammates[teammates.length - 1 - x - 1].role.data,
                  false,
                  false,
                  true,
                  "No Change"
                );
              } else {
                teammates[teammates.length - 1 - x].setRole(
                  `${tempRole}:${tempMod}`,
                  tempData,
                  false,
                  false,
                  true,
                  "No Change"
                );
              }
            }
          }
          for (let x = 0; x < teammates.length; x++) {
            this.game.events.emit("roleAssigned", teammates[x]);
          }
        },
      },
    ];
    */
  }
};
