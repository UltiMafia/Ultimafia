const Card = require("../../Card");
const Action = require("../../Action");
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
          role: this.role,
          run: function () {
            if (this.target == "No") return;

            this.role.openedDoorLastNight = true;

            var evil = this.game
              .alivePlayers()
              .filter((p) => p.role.alignment != "Village");
            var evilPlayer = Random.randArrayVal(evil, true);
            if (!evilPlayer) {
              // impossible as game will end
              return;
            }
            let info = this.game.createInformation(
              "EvilPlayerInfo",
              this.actor,
              this.game,
              this.actor
            );
            info.processInfo();

            this.game.queueAlert(`The Mistress has opened the door!`);
            this.actor.queueAlert(
              `You learn that ${
                info.getInfoRaw().name
              } is evil and cannot be trusted!`
            );
          },
        },
      },
    };
    /*
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
            this.actor.kill("mistress", this.actor);
          }

          delete this.actor.role.openedDoorLastNight;
        },
      },
    ];
*/

    this.listeners = {
      state: function (stateInfo) {
        if (!this.player.hasAbility(["OnlyWhenAlive", "Kill"])) {
          return;
        }

        if (!stateInfo.name.match(/Night/)) {
          return;
        }

        var action = new Action({
          actor: this.player,
          game: this.player.game,
          priority: PRIORITY_KILL_DEFAULT + 1,
          role: this.role,
          run: function () {
            if (!this.role.openedDoorLastNight) return;

            var visitors = this.getVisitors();
            var imminentDeath = !visitors.find(
              (visitor) => visitor.role.alignment == "Village"
            );

            // death is absolute
            if (imminentDeath) {
              this.actor.kill("mistress", this.actor);
            }

            delete this.role.openedDoorLastNight;
          },
        });

        this.game.queueAction(action);
      },
    };
  }
};
