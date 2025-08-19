const Card = require("../../Card");
const Random = require("../../../../../lib/Random");
const { PRIORITY_WIN_CHECK_DEFAULT } = require("../../const/Priority");
const { CULT_FACTIONS } = require("../../const/FactionList");

module.exports = class Twins extends Card {
  constructor(role) {
    super(role);
    this.target = "";

    this.winCheckSpecial = {
      priority: PRIORITY_WIN_CHECK_DEFAULT,
      againOnFinished: true,
      check: function (counts, winners, aliveCount, confirmedFinished) {
        if (!this.hasAbility(["Win-Con"])) {
          return;
        }

        if (this.data.twincondemned && this.hasAbility(["Win-Con"])) {
          for (let player of this.game.players) {
            if (CULT_FACTIONS.includes(player.faction)) {
              winners.addPlayer(player, player.faction);
            }
          }
        }
      },
    };

    this.listeners = {
      roleAssigned: function (player) {
        if (player !== this.player) {
          if (this.target && this.target == player) {
            if (this.player.faction != this.target.faction) {
              return;
            }
          } else {
            return;
          }
        }
        let nonMafia;
        if (this.player.faction == "Village") {
          nonMafia = this.game.players.filter(
            (p) =>
              p.faction != this.player.faction && p.alive && p !== this.player
          );
        } else {
          nonMafia = this.game.players.filter(
            (p) => p.faction == "Village" && p.alive && p !== this.player
          );
        }
        if (nonMafia.length <= 0) {
          this.player.queueAlert(`No One was able to be your Twin!`);
          return;
        }
        this.target = Random.randArrayVal(nonMafia);
        this.player.queueAlert(
          `${this.target.name} is your Twin and their role is ${this.target.role.name}. Get them condemned for Cult to Win!`
        );
        this.target.queueAlert(
          `${this.player.name} is your Twin and their role is ${this.player.role.name}. If you get condemned Cult Wins!`
        );
      },
      death: function (player, killer, deathType) {
        if (
          ((player === this.target && this.target.faction == "Village") ||
            (player == this.player && this.player.faction == "Village")) &&
          deathType === "condemn" &&
          this.hasAbility(["Win-Con"])
        ) {
          this.data.twincondemned = true;
        }
      },
    };
  }
};
