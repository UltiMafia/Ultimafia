const Card = require("../../Card");
const Action = require("../../Action");
const {
  PRIORITY_INVESTIGATIVE_AFTER_RESOLVE_DEFAULT,
} = require("../../const/Priority");

module.exports = class LearnCondemnedRole extends Card {
  constructor(role) {
    super(role);

    this.passiveActions = [
      {
        ability: ["Information"],
        actor: role.player,
        state: "Night",
        game: role.game,
        role: role,
        priority: PRIORITY_INVESTIGATIVE_AFTER_RESOLVE_DEFAULT - 5,
        labels: ["investigate"],
        run: function () {
          
          if (!this.role.CondemnedPlayer || this.role.CondemnedPlayer == null) {
            return;
          }

          let info = this.game.createInformation(
              "RoleInfo",
              this.actor,
              this.game,
              this.target
            );
          info.processInfo();
          this.actor.role.hasInfo = true;
          var alert = `:invest: ${info.getInfoFormated()}`;
          this.actor.queueAlert(alert);
          this.role.CondemnedPlayer = null;
        },
      },
    ];

    this.listeners = {
      death: function (player, killer, deathType) {
        if (deathType == "condemn"){
          this.CondemnedPlayer = player;
        }
      },
    };
    
  }
};
