const Card = require("../../Card");
const { PRIORITY_MODIFY_INVESTIGATIVE_RESULT_DEFAULT } = require("../../const/Priority");

module.exports = class MakeAllVillageInfoFalse extends Card {
  constructor(role) {
    super(role);

    this.actions = [
      {
        priority: PRIORITY_MODIFY_INVESTIGATIVE_RESULT_DEFAULT,
        labels: ["effect"],
        run: function () {
          if (this.game.getStateName() != "Night") return;
          if (!this.actor.alive) return;
          //let players = this.game.players.filter((p) => p.role.alignment == "Village");
          let players = this.game.players.filter((p) => p.role);
          for (let x = 0; x < players.length; x++) {
            players[x].giveEffect("FalseMode",1);
          }
        },
      },
    ];
  }
};
