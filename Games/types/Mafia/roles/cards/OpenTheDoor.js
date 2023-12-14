const Card = require("../../Card");
const Random = require("../../../../../lib/Random");
const { PRIORITY_DAY_DEFAULT } = require("../../const/Priority");
const { PRIORITY_KILL_DEFAULT } = require("../../const/Priority");

module.exports = class OpenTheDoor extends Card {
  constructor(role) {
    super(role);

    role.openedDoor = false;

    this.meetings = {
      "Open the Door": {
        states: ["Day"],
        flags: ["voting"],
        inputType: "boolean",
        action: {
          priority: PRIORITY_DAY_DEFAULT,
          run: function () {
            if (this.target == "No") return;

            this.actor.role.openedDoor = true;
            this.actor.role.openedDoorLastNight = true;

            var evil = this.game
              .alivePlayers()
              .filter((p) => p.role.alignment != "Village");
            var evilPlayer = Random.randArrayVal(evil, true);
            if (!evilPlayer) {
              // impossible as game will end
              return;
            }

            this.game.queueAlert(`The Mistress has opened the door!`);
            this.actor.queueAlert(
              `You learn that ${evilPlayer.name} is evil and cannot be trusted!`
            );
          },
        },
        shouldMeet() {
          return !this.openedDoor;
        },
      },
    };

    this.actions = [
      {
        priority: PRIORITY_KILL_DEFAULT + 1,
        run: function () {
          if (this.game.getStateName() != "Night") return;
          if (!this.actor.role.openedDoorLastNight) return;

          var visitors = this.getVisitors();
          var imminentDeath = !visitors.find(
            (visitor) => visitor.role.alignment == "Village"
          );

          // death is absolute
          if (imminentDeath) {
            this.actor.kill("bluebeard", this.actor);
          }

          delete this.actor.role.openedDoorLastNight;
        },
      },
    ];
  }
};
