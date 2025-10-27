const Card = require("../../Card");
const Action = require("../../Action");
const {
  PRIORITY_INVESTIGATIVE_AFTER_RESOLVE_DEFAULT,
} = require("../../const/Priority");

module.exports = class EvilPairs extends Card {
  constructor(role) {
    super(role);

    this.passiveActions = [
      {
        ability: ["Information"],
        actor: role.player,
        state: "Night",
        game: role.game,
        role: role,
        priority: PRIORITY_INVESTIGATIVE_AFTER_RESOLVE_DEFAULT - 10,
        labels: ["investigate"],
        run: function () {
          if (this.role.hasInfo) return;
          let info = this.game.createInformation(
            "EvilPairsInfo",
            this.actor,
            this.game
          );
          info.processInfo();
          this.role.hasInfo = true;
          var alert = `:invest: ${info.getInfoFormated()}.`;
          this.actor.queueAlert(alert);
        },
      },
    ];

    /*
    this.listeners = {
      state: function (stateInfo) {
        if (!this.hasAbility(["Information", "OnlyWhenAlive"])) {
          return;
        }

        if (!stateInfo.name.match(/Night/)) {
          return;
        }

        var action = new Action({
          actor: this.player,
          game: this.player.game,
          role: this,
          priority: PRIORITY_INVESTIGATIVE_AFTER_RESOLVE_DEFAULT - 10,
          labels: ["investigate"],
          run: function () {
            if (this.role.hasInfo) return;
            if (!this.actor.alive) return;
            let info = this.game.createInformation(
              "EvilPairsInfo",
              this.actor,
              this.game
            );
            info.processInfo();
            this.role.hasInfo = true;
            var alert = `:invest: ${info.getInfoFormated()}.`;
            this.actor.queueAlert(alert);
          },
        });

        this.game.queueAction(action);
      },
    };
    */
  }
};
