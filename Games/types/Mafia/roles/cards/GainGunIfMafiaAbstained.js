const Card = require("../../Card");
const Action = require("../../Action");
const { PRIORITY_ITEM_GIVER_EARLY } = require("../../const/Priority");

module.exports = class GainGunIfMafiaAbstained extends Card {
  constructor(role) {
    super(role);

    this.passiveActions = [
      {
        ability: ["Item"],
        state: "Night",
        actor: role.player,
        game: role.player.game,
        priority: PRIORITY_ITEM_GIVER_EARLY,
        labels: ["hidden"],
        role: role,
        run: function () {
            if (this.role.data.gainedGun) return;

            let mafiaKilled = false;
            for (let action of this.game.actions[0]) {
              if (action.hasLabels(["kill", "mafia"])) {
                mafiaKilled = true;
                break;
              }
            }

            if (!mafiaKilled) {
              this.actor.holdItem("Gun", { reveal: true, modifiers: true });
              this.actor.queueGetItemAlert("Gun");
              this.role.data.gainedGun = true;
            }
          },
      },
    ];

  }
};
