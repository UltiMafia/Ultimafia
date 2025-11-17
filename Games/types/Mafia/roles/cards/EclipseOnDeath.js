const Card = require("../../Card");
const { PRIORITY_EFFECT_GIVER_DEFAULT } = require("../../const/Priority");

module.exports = class EclipseOnDeath extends Card {
  constructor(role) {
    super(role);

    this.passiveActions = [
      {
        ability: ["Effect", "WhenDead"],
        state: "Night",
        actor: role.player,
        game: role.player.game,
        priority: PRIORITY_EFFECT_GIVER_DEFAULT,
        labels: ["dream", "hidden", "investigate"],
        role: role,
        run: function () {
          if (this.role.data.causeEclipse != true) {
            return;
          }
          for (let p of this.game.players) {
            this.role.giveEffect(p, "Blind", 1);
          }

          this.game.queueAlert(`Everything goes dark as an eclipse begins.`);
          this.role.data.causeEclipse = false;
        },
      },
    ];

    this.listeners = {
      death: function (player, killer, killType) {
        if (!this.hasAbility(["Effect", "WhenDead"])) {
          return;
        }
        if (player == this.player) this.data.causeEclipse = true;
      },
    };
  }
};
