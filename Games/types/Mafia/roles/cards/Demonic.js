const Card = require("../../Card");
const { CULT_FACTIONS, MAFIA_FACTIONS } = require("../../const/FactionList");

module.exports = class Demonic extends Card {
  constructor(role) {
    super(role);

    this.listeners = {
      roleAssigned: function (player) {
        if (player !== this.player) {
          return;
        }

        if (
          this.player.hasItem("IsTheTelevangelist") ||
          this.player.role.name == "Televangelist" ||
          CULT_FACTIONS.includes(this.player.faction)
        ) {
          this.player.queueAlert(
            `The Cult has Choosen you to perform the Demonic Ritual! Cult dies if no Demonic Players are alive so You must survive!`
          );
        } else if (MAFIA_FACTIONS.includes(this.player.faction)) {
          this.player.queueAlert(
            `The Cult has Choosen you to perform the Demonic Ritual! Cult dies if no Demonic Players are alive so This could be useful!`
          );
        } else if (this.player.faction == "Independent") {
          this.player.queueAlert(
            `The Cult has Choosen you to perform the Demonic Ritual! Cult dies if no Demonic Players are alive so This will make things interesting!`
          );
        } else {
          this.player.queueAlert(
            `The Cult has Choosen you to perform the Demonic Ritual! Cult dies if no Demonic Players are alive so you must die to Stop them!`
          );
        }
        if (
          this.player.hasItem("IsTheTelevangelist") ||
          this.player.role.name == "Televangelist"
        ) {
          return;
        }
        this.game.queueAlert(
          `A ${this.player.role.name} is Demonic! Don't let them die!`,
          0,
          this.game.players.filter(
            (p) => CULT_FACTIONS.includes(p.faction) && p != this.player
          )
        );
      },
      death: function (player, killer, killType, instant) {
        /*
        var aliveRoles = this.game
          .alivePlayers()
          .filter(
            (p) =>
              this.game
                .getRoleTags(
                  this.game.formatRoleInternal(p.role.name, p.role.modifier)
                )
                .includes("Demonic") &&
              !(
                p.hasItem("IsTheTelevangelist") ||
                p.role.name == "Televangelist"
              )
          );
          */
        var aliveRoles = this.game
          .alivePlayers()
          .filter((p) => p.isDemonic(true));
        if (aliveRoles.length > 0) {
          return;
        }

        if (
          this.player.hasItem("IsTheTelevangelist") ||
          this.player.role.name == "Televangelist"
        ) {
          return;
        }

        var devotion = this.game.players.filter(
          (p) => p.hasEffect("DevotionEffect") == true
        );
        if (devotion.length > 0) {
          var backUpTarget = devotion.filter((p) => p.hasEffect("DevoteeEffect"));
          if (backUpTarget.length > 0) {
            backUpTarget[0].setRole(
              `${this.player.role.name}:${this.player.role.modifier}`,
              this.player.role.data,
              false,
              false,
              false,
              "No Change"
            );
            return;
          }
          this.game.events.emit("Devotion", this.player);
          return;
        }
        //this.game.queueAlert(`We Got here ${aliveRoles.length}`);
        for (let p of this.game.alivePlayers()) {
          if (CULT_FACTIONS.includes(p.faction) || p.faction == "Evil") {
            p.kill("basic", this.player, instant);
          }
        }
      },
    };
  }
};
