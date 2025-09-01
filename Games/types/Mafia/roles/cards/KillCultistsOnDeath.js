const Card = require("../../Card");
const Action = require("../../Action");
const { PRIORITY_CONVERT_DEFAULT } = require("../../const/Priority");

module.exports = class KillCultistsOnDeath extends Card {
  constructor(role) {
    super(role);

    this.listeners = {
      /*
      start: function () {
        if (this.player.hasItem("IsTheTelevangelist")) {
          return;
        }
        const hasCultLeader =
          this.game.players.filter((p) => p.role.data.cultLeader).length > 0;
        if (!hasCultLeader) {
          this.data.cultLeader = true;
          this.player.queueAlert("You are the Cult Leader.");
        }
      },
      */
      death: function (player, killer, deathType, instant) {
        if (player != this.player) {
          return;
        }

        if (this.player.hasItem("IsTheTelevangelist")) {
          return;
        }
        /*
        if (!this.data.cultLeader) {
          return;
        }
        */
        var devotion = this.game.players.filter((p) =>
          p.hasEffect("DevotionEffect")
        );
        if (devotion.length > 0) {
          var backUpTarget = devotion.filter((p) =>
            p.hasEffect("DevoteeEffect")
          );
          if (backUpTarget.length > 0) {
            backUpTarget.setRole(
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

        for (const player of this.game.players) {
          if (player.alive && player.role.name === "Cultist") {
            player.kill("basic", this.player, instant);
          }
        }
      },
      state: function (stateInfo) {
        if (!this.player.alive) {
          return;
        }

        if (!stateInfo.name.match(/Night/)) {
          return;
        }

        var action = new Action({
          actor: this.player,
          game: this.player.game,
          priority: PRIORITY_CONVERT_DEFAULT + 1,
          labels: ["kill", "hidden"],
          run: function () {
            if (this.actor.alive) {
              return;
            }
            for (const player of this.game.players) {
              if (player.alive && player.role.name === "Cultist") {
                player.kill("basic", this.actor);
              }
            }
          },
        });

        this.game.queueAction(action);
      },
    };
  }
};
