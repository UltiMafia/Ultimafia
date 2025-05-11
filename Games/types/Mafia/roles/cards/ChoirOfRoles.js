const Card = require("../../Card");
const Random = require("../../../../../lib/Random");
const Action = require("../../Action");
const { PRIORITY_EFFECT_GIVER_DEFAULT } = require("../../const/Priority");
const { PRIORITY_OVERTHROW_VOTE } = require("../../const/Priority");

module.exports = class ChoirOfRoles extends Card {
  constructor(role) {
    super(role);

    this.meetings = {
      "Guess Wailer": {
        actionName: "Guess",
        states: ["Day"],
        flags: ["voting", "instant", "noVeg"],
        targets: { include: ["alive"], exclude: ["self", isPrevTarget] },
        labels: ["hidden", "absolute", "condemn", "overthrow"],
        action: {
          priority: PRIORITY_OVERTHROW_VOTE - 2,
          run: function () {
            this.actor.role.data.prevTarget = this.target;
            if (this.target.hasEffect("ChoirSong")) {
              var action = new Action({
                actor: this.actor,
                target: this.target,
                game: this.actor.game,
                priority: PRIORITY_OVERTHROW_VOTE - 1,
                labels: ["hidden", "absolute", "condemn", "overthrow"],
                run: function () {
                  //New code
                  if (!this.actor.hasAbility(["Condemn"])) {
                    return;
                  }
                  for (let action of this.game.actions[0]) {
                    if (
                      action.hasLabel("condemn") &&
                      !action.hasLabel("overthrow")
                    ) {
                      // Only one village vote can be overthrown
                      action.cancel(true);
                      break;
                    }
                  }

                  if (this.dominates(this.target)) {
                    this.target.kill("condemn", this.actor);
                  }
                },
              });
              this.game.queueAction(action);
              for (const player of this.game.players) {
                player.giveEffect("Unveggable");
              }
              this.game.gotoNextState();
            } //End if
            else {
              if (this.actor.role.data.singer) {
                this.actor.queueAlert(
                  `${this.actor.role.data.singer.name} was singing about ${this.actor.role.data.singAbout}, Your guess was Incorrect. You cannot Guess ${this.target.name} tomorrow!`
                );
              }
            }
          },
        },
      },
    };

    this.listeners = {
      state: function (stateInfo) {
        if (!this.player.hasAbility(["Effect"])) {
          return;
        }
        if (!stateInfo.name.match(/Night/)) {
          return;
        }

        var action = new Action({
          actor: this.player,
          game: this.player.game,
          priority: PRIORITY_EFFECT_GIVER_DEFAULT,
          labels: ["effect"],
          run: function () {
            let roles = this.game.PossibleRoles.filter((r) => r);
            let players = this.game
              .alivePlayers()
              .filter((p) => p.role.alignment != "Cult");

            let role = Random.randArrayVal(roles, true)
              .split(":")[0]
              .toLowerCase();
            let victim = Random.randArrayVal(players, true);

            victim.queueAlert(
              `From your bedroom window you heard the Banshee's wailing about the ${role}. You must say ${role} today or you will be condenmed! If the Banshee guesses your name as their target you will be condenmed anyway so be sneaky!`
            );
            victim.giveEffect("ChoirSong", this.actor, role, 1); //,this.actor,role,1
            this.actor.role.data.singer = victim;
            this.actor.role.data.singAbout = role;
          },
        });

        this.game.queueAction(action);
      },
    };
  }
};

function isPrevTarget(player) {
  return this.role && player == this.role.data.prevTarget;
}
