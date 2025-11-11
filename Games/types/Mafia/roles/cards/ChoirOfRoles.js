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
          role: this.role,
          priority: PRIORITY_OVERTHROW_VOTE - 2,
          run: function () {
            this.role.data.prevTarget = this.target;
            if (this.target.hasEffect("ChoirSong")) {
              var action = new Action({
                role: this.role,
                actor: this.actor,
                target: this.target,
                game: this.actor.game,
                priority: PRIORITY_OVERTHROW_VOTE - 1,
                labels: ["hidden", "absolute", "condemn", "overthrow"],
                run: function () {
                  //New code
                  if (!this.role.hasAbility(["Condemn"])) {
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
              if (this.role.data.singer) {
                this.actor.queueAlert(
                  `${this.role.data.singer.name} was singing about ${this.role.data.singAbout}, Your guess was Incorrect. You cannot Guess ${this.target.name} tomorrow!`
                );
              }
            }
          },
        },
      },
    };


    this.passiveActions = [
      {
        ability: ["Effect"],
        state: "Night",
        actor: role.player,
        game: role.player.game,
        priority: PRIORITY_EFFECT_GIVER_DEFAULT,
        labels: ["effect"],
        role: role,
        run: function () {
            let roles = this.role.getAllRoles().filter((r) => r);
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
            this.role.giveEffect(victim, "ChoirSong", this.actor, role, 1); //,this.actor,role,1
            this.role.data.singer = victim;
            this.role.data.singAbout = role;
          },
      },
    ];

    
  }
};

function isPrevTarget(player) {
  return this.role && player == this.role.data.prevTarget;
}
