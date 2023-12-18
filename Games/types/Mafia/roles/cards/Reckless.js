const Card = require("../../Card");
const { PRIORITY_KILL_DEFAULT } = require("../../const/Priority");
const Random = require("../../../../../lib/Random");

module.exports = class Reckless extends Card {
  constructor(role) {
    super(role);

    this.actions = [
      {
        priority: PRIORITY_KILL_DEFAULT,
        labels: ["investigate", "role", "hidden", "absolute"],
        run: function () {
          if (this.game.getStateName() != "Night") return;

          if (!this.actor.alive) return;

          let targets = this.getVisits(this.actor);
          
          const opposingAlignments = {
            Independent: Random.randArrayVal(["Village", "Mafia", "Cult"]),
            Hostile: Random.randArrayVal(["Village", "Mafia", "Cult"]),
            Mafia: "Village",
            Cult: "Village",
            Village: ["Mafia" || "Cult"],
          };
          
          for (let target of targets) {
            let targetAlignment = this.target.role.alignment;
            let actorAlignment = this.actor.role.alignment;
            let opposingAlignment = opposingAlignments[actorAlignment];
            if (targetAlignment === actorAlignment) {
              if (this.dominates()) this.actor.kill("reckless", this.actor);
            } else if (targetAlignment === opposingAlignment) {
              // will implement soon
              return;
            }
          }
        },
      },
    ];
  }
};
