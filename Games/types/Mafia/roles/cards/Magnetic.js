const Card = require("../../Card");
const Action = require("../../Action");
const Random = require("../../../../../lib/Random");
const { PRIORITY_MODIFY_ACTION } = require("../../const/Priority");

module.exports = class Magnetic extends Card {
  constructor(role) {
    super(role);

    this.passiveActions = [
      {
        ability: ["OnlyWhenAlive"],
        actor: role.player,
        state: "Night",
        game: role.game,
        role: role,
        priority: PRIORITY_MODIFY_ACTION - 1,
        labels: ["redirect"],
        run: function () {
            var alive = this.game.players.filter(
              (p) =>
                p.alive &&
                p != this.actor &&
                p.role.alignment == this.actor.role.alignment
            );
            if (alive.length > 0) {
              for (const action of this.game.actions[0]) {
                if (
                  action.target != this.actor &&
                  alive.includes(action.target) &&
                  action.hasLabel("kill")
                ) {
                  action.target = this.actor;
                }
              }
            }
          },
      },
    ];

  }
};
