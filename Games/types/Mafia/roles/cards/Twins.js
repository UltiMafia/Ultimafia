const Card = require("../../Card");
const Random = require("../../../../../lib/Random");
const { PRIORITY_WIN_BY_CONDEMNING } = require("../../const/Priority");

module.exports = class Twins extends Card {
  constructor(role) {
    super(role);
    this.target = "";

    this.listeners = {
      roleAssigned: function (player) {
        if (player !== this.player) {
          return;
        }

        const nonMafia = this.game.players.filter(
          (p) =>
            (p.faction != this.player.faction) &&
            p.alive &&
            p !== this.player
        );
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
          player === this.target &&
          deathType === "condemn" &&
          this.player.alive
        ) {
          this.player.role.data.twincondemned = true;
        }
        else if(player === this.target &&
          deathType != "condemn" &&
          this.player.alive){
            const nonMafia = this.game.players.filter(
              (p) =>
                (p.faction != this.player.faction) &&
                p.alive &&
                p !== this.player
            );
            this.target = Random.randArrayVal(nonMafia);
            this.player.queueAlert(
              `${this.target.name} is your Twin and their role is ${this.target.role.name}. Get them condemned for ${this.player.faction} to Win!`
            );
            this.target.queueAlert(
              `${this.player.name} is your Twin and their role is ${this.player.role.name}. If you get condemned ${this.player.faction} Wins!`
            );

        }
      },
    };
  }
};
