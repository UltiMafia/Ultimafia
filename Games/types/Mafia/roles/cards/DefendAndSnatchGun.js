const Card = require("../../Card");
const Action = require("../../Action");
const Random = require("../../../../../lib/Random");

module.exports = class DefendAndSnatchGun extends Card {
  constructor(role) {
    super(role);

    this.immunity.gun = "Infinity";
    this.listeners = {
      immune(action) {
        if (action.target !== this.player) {
          return;
        }

        if (!action.hasLabel("gun")) {
          return;
        }

        const toSnatch = Random.randFloatRange(0, 100) <= 80;
        if (toSnatch) {
          action.item.hold(this.player);
          action.item.incrementMeetingName();
          this.game.instantMeeting(action.item.meetings, [this.player]);
          return;
        }

        const killAction = new Action({
          // do not add gun label
          labels: ["kill"],
          actor: action.actor,
          target: this.player,
          game: this.player.game,
          run() {
            if (this.dominates()) {
              this.target.kill("gun", this.actor, true);
            }
          },
        });
        this.game.instantAction(killAction);
      },
    };
  }
};
