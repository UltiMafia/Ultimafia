const Card = require("../../Card");
const { PRIORITY_INVESTIGATIVE_DEFAULT } = require("../../const/Priority");

module.exports = class LearnEvilDeadCount extends Card {
  constructor(role) {
    super(role);

    this.actions = [
      {
        priority: PRIORITY_INVESTIGATIVE_DEFAULT,
        labels: ["investigate"],
        run: function () {
          if (this.game.getStateName() != "Night") return;

          let dead = this.game.players.filter((p) => !p.alive);
          let evilCount = dead.filter(
            (p) => (p.role.alignment !== "Villager"
            && p.role.alignment !== "Outcast")
          ).length;

          if (this.isInsane()){
            evilCount += (Math.floor(Math.random() * (evilCount * 2)) - evilCount); // can show variation from 0 - 2*evilcount
            if (evilCount > dead.length) evilCount = dead.length;
            if (evilCount < 0) evilCount = 0;
          }

          this.actor.queueAlert(
            `You learn that there are ${evilCount} evils in the graveyard.`
          );
        },
      },
    ];
  }
};
