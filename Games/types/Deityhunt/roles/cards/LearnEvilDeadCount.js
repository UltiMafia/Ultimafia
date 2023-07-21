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

          let dead = this.game.deadPlayers();
          let deadCount = dead.filter(
            (p) => (p.role.alignment === "Follower"
            || p.role.alignment === "Deity")
          ).length;

          this.actor.queueAlert(
            `You learn that there are ${deadCount} evils in the graveyard.`
          );
        },
      },
    ];
  }
};
