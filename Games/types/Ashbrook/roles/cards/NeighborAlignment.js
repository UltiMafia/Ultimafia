const Card = require("../../Card");
const Random = require("../../../../../lib/Random");
const { PRIORITY_INVESTIGATIVE_DEFAULT } = require("../../const/Priority");

module.exports = class NeighborAlignment extends Card {
  constructor(role) {
    super(role);

    this.actions = [
      {
        priority: PRIORITY_INVESTIGATIVE_DEFAULT,
        labels: ["investigate"],
        run: function () {
          if (this.game.getStateName() != "Night") return;
          if (!this.actor.alive) return;

          let neighbors = this.getAliveNeighbors();
          let evilCount;
          if (this.isInsane()){
            evilCount = Random.randArrayVal([0,1,2]);
          } else {
            evilCount = neighbors.filter(
              (p) => (p.role.alignment !== "Villager"
              && p.role.alignment !== "Outcast")
            ).length;
          }

          this.actor.queueAlert(
            `You learn that you have ${evilCount} evil neighbors!`
          );
        },
      },
    ];
  }
};
