const Card = require("../../Card");
const Action = require("../../Action");
const { PRIORITY_CONVERT_DEFAULT } = require("../../const/Priority");

module.exports = class ConvertVisitors extends Card {
  constructor(role) {
    super(role);


    this.passiveActions = [
      {
        ability: ["Convert"],
        state: "Night",
        actor: role.player,
        game: role.player.game,
        priority: PRIORITY_CONVERT_DEFAULT,
        labels: ["convert", "hidden"],
        role: role,
        run: function () {
            let visitors = this.getVisitors();
            for (let visitor of visitors)
              if (this.dominates(visitor)) visitor.setRole("Cultist");
          },
      },
    ];
    
  }
};
