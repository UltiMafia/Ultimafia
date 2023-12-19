const Card = require("../../Card");
const { PRIORITY_INVESTIGATIVE_DEFAULT } = require("../../const/Priority");

module.exports = class PaintPortraits extends Card {
  constructor(role) {
    super(role);

    this.actions = [
      {
        priority: PRIORITY_INVESTIGATIVE_DEFAULT,
        labels: ["investigate", "role", "hidden", "absolute"],
        run: function () {
          if (this.game.getStateName() != "Night") return;

          if (!this.actor.alive) return;

          let visitors = this.getVisitors(this.actor);
          if (visitors?.length) {
            let visitorNames = visitors.map((v) => v.name);
            visitorNames.forEach((portrait) => { if (!this.actor.role.data.portraits.includes(portrait)) { this.actor.role.data.portraits.push(portrait); } });
          }
        },
      },
    ];
    this.listeners = {
      death: function (player, killer, deathType) {
        if (player === this.player && this.data.portraits) {
          let portraits = Random.randomizeArray(this.data.portraits);
          painterAuction = `:paintbrush: ${this.player.name}'s extensive collection of paintings have gone up for auction. Among them are portraits of ${portraits.join(", ")}`;
          this.game.queueAlert(painterAuction);
        }
      },
    };
  }
};
