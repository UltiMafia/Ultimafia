const Card = require("../../Card");
const { PRIORITY_INVESTIGATIVE_AFTER_RESOLVE_DEFAULT } = require("../../const/Priority");

module.exports = class Omiscient extends Card {
  constructor(role) {
    super(role);

    this.actions = [
      {
        priority: PRIORITY_INVESTIGATIVE_AFTER_RESOLVE_DEFAULT,
        labels: ["investigate"],
        run: function () {
           for (const player of this.game.alivePlayers()){
            let visits = player.getVisits(this.target);
            let visitNames = visits.map((p) => p.name);
            let role = player.role.name;
            if (visitNames.length == 0) visitNames.push("no one");
            this.actor.queueAlert(:track: ${player.target.name} visited ${visitNames.join(", ")} during the night and ${player.target.name}'s role is ${role}.);
           }
        },
      },
    ];
  }
};
