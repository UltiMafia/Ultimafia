const Card = require("../../Card");
const { PRIORITY_INVESTIGATIVE_DEFAULT } = require("../../const/Priority");

module.exports = class Omiscient extends Card {
  constructor(role) {
    super(role);

    this.actions = [
      {
        priority: PRIORITY_INVESTIGATIVE_DEFAULT,
        labels: ["investigate"],
        run: function () {
          if (this.game.getStateName() != "Night") return;
          if (!this.actor.alive) return;
          let visits;
          let visitNames;
          let role;
          let name;
          let players = this.game.alivePlayers();
          for (let x = 0; x < players.length; x++) {
            visits = this.getVisits(players[x]);
            visitNames = visits.map((p) => p.name);
            role = players[x].role.name;
            if(this.actor.hasEffect("FalseMode")){
              visits = this.getVisits(Random.randArrayVal(players));
              visitNames = visits.map((p) => p.name);
              role = Random.randArrayVal(players).role.name;
            }
            name = players[x].name;
            if (visitNames.length == 0) visitNames.push("no one");
            this.actor.queueAlert(
              `:track: ${name}'s role is ${role} and they visited ${visitNames.join(
                ", "
              )} during the night.`
            );
          }
        },
      },
    ];
  }
};
