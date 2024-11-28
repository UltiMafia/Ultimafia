const Card = require("../../Card");
const { PRIORITY_CONVERT_DEFAULT } = require("../../const/Priority");

module.exports = class ConvertVisitors extends Card {
  constructor(role) {
    super(role);
/*
    this.actions = [
      {
        priority: PRIORITY_CONVERT_DEFAULT,
        labels: ["convert", "hidden"],
        run: function () {
          if (!this.actor.alive) return;

          if (this.game.getStateName() != "Night") return;

          let visitors = this.getVisitors();

          for (let visitor of visitors)
            if (this.dominates(visitor)) visitor.setRole("Cultist");
        },
      },
    ];
*/
      this.listeners = {
      state: function (stateInfo) {
        if (!stateInfo.name.match(/Night/)) {
          return;
        }

        var action = new Action({
        actor: this.player,
        game: this.player.game,
        priority: PRIORITY_CONVERT_DEFAULT,
        labels: ["convert", "hidden"],
        run: function () {
          let visitors = this.getVisitors();
          for (let visitor of visitors)
            if (this.dominates(visitor)) visitor.setRole("Cultist");
        },
        });

        this.game.queueAction(action);
      },
    };
    
  }
};
