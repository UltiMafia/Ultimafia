const Card = require("../../Card");
const Random = require("../../../../../lib/Random");
const { PRIORITY_DAY_DEFAULT } = require("../../const/Priority");
const { PRIORITY_KILL_DEFAULT } = require("../../const/Priority");

module.exports = class OpenTheDoor extends Card {
  constructor(role) {
    super(role);

    this.meetings = {
      "Open the Door": {
        states: ["Day"],
        flags: ["voting"],
        inputType: "boolean",
        action: {
          priority: PRIORITY_DAY_DEFAULT,
          run: function () {
            if (this.dominates()) {
              if (this.target == "No") return;
                var alive = this.game.players.filter((p) => p.alive);
                var evil = alive.filter((p) => p.role.alignment != "Village");
                var evilPlayer = Random.randArrayVal(evil, true);
                this.game.queueAlert(`Bluebeard's Wife has opened the door!`);
                this.actor.queueAlert(`You learn that ${evilPlayer.name} is evil and cannot be trusted!`);
                this.actor.role.data.truth = true;
            }
          },
        },
        shouldMeet() {
          return !this.data.truth;
        },
      },
    },

    this.actions = [
    {
      priority: PRIORITY_KILL_DEFAULT + 1,
      run: function () {
        if (this.game.getStateName() != "Night") return;
        if (!this.actor.role.data.truth) return;

        var visitors = this.getVisitors(this.actor);
        var imminentDeath = !visitors.find(
          (visitor) => visitor.role.alignment != "Village"
        );
        
        if (imminentDeath) {
          this.actor.kill("bluebeard", this.actor);
        } 
        this.actor.role.data.truth = false;
      },
      },
    ];
  }
};
