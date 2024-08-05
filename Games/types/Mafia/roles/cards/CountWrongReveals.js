const Card = require("../../Card");
const {
  PRIORITY_INVESTIGATIVE_AFTER_RESOLVE_DEFAULT,
} = require("../../const/Priority");

module.exports = class CountWrongReveals extends Card {
  constructor(role) {
    super(role);

    this.actions = [
      {
        priority: PRIORITY_INVESTIGATIVE_AFTER_RESOLVE_DEFAULT - 1,
        labels: ["investigate"],
        run: function () {
          if (this.game.getStateName() != "Night") return;
          if (!this.actor.alive) return;
          //let visitors;
          let problemCount = 0;
          let role;
          let appearRole;

          let players = this.game.players.filter((p) => p.role);
          for (let x = 0; x < players.length; x++) {
            //visitors = this.getVisits(players[x]);
            role = players[x].role.name;
            appearRole = players[x].getRoleAppearance().split(" (")[0];

            if (role != appearRole) {
              problemCount = problemCount + 1;
            }
          }
          this.actor.queueAlert(
            `You learn that ${problemCount} problems occured during the night.`
          );
        },
      },
    ];
  }
};
