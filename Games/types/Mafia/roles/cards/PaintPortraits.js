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
  }
};
