const Card = require("../../Card");
const Action = require("../../Action");
const { PRIORITY_NIGHT_SAVER } = require("../../const/Priority");

module.exports = class ConvertSave extends Card {
  constructor(role) {
    super(role);

    this.listeners = {
      immune: function (action) {
        if (action.target !== this.SavedPlayer) {
          return;
        }

        if (!action.hasLabel("kill")) {
          return;
        }
        if (!this.hasAbility(["Convert"])) {
          return;
        }


        let convertAction = new Action({
          labels: ["convert", "cult"],
          actor: this.player,
          target: action.target,
          game: this.player.game,
          run: function () {
            if (this.dominates()) {
              this.target.setRole("Cultist");
            }
          },
        });
        this.game.instantAction(convertAction);
      },
      state: function (stateInfo) {
        if (!stateInfo.name.match(/Day/)) {
          return;
        }
      this.SavedPlayer = null;
      
      },
    };

    this.meetings = {
      Save: {
        states: ["Night"],
        flags: ["voting"],
        action: {
          labels: ["save"],
          role: this.role,
          priority: PRIORITY_NIGHT_SAVER,
          run: function () {
            this.role.SavedPlayer = this.target;
            this.heal(1);
            /*
            let killers = this.getVisitors(this.target, "kill");
            if (killers.length == 0) {
              return;
            }
            this.actor.role.killers = killers;
            this.actor.role.savedRole = this.target.role.name;
            this.target.setRole("Cultist");
            */
          },
        },
      },
    };
  }
};
