const Card = require("../../Card");
const Action = require("../../Action");
const Random = require("../../../../../lib/Random");
const { PRIORITY_MODIFY_ACTION } = require("../../const/Priority");

module.exports = class BouncyOnce extends Card {
  constructor(role) {
    super(role);

    this.passiveActions = [
      {
        ability: ["Modifier", "OnlyWhenAlive"],
        state: "Night",
        actor: role.player,
        game: role.player.game,
        priority: PRIORITY_MODIFY_ACTION,
        labels: ["redirect"],
        role: role,
        run: function () {
            if(role.hasBounced == true){
                return;
            }
            role.hasBounced = true;
          var alive = this.game.players.filter(
            (p) =>
              p.alive &&
              p != this.actor
          );
        
            for (const action of this.game.actions[0]) {
                alive = this.game.players.filter((p) => p.alive && p != this.actor && !action.actors.includes(p));
                if (alive.length > 0) {
              var randomTarget = Random.randArrayVal(alive);
              if (action.target === this.actor && action.hasLabel("kill")) {
                action.target = randomTarget;
              }
            }
            }
          
        },
      },
    ];
  }
};
