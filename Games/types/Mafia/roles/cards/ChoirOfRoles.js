const Card = require("../../Card");
const Random = require("../../../../../lib/Random");
const { PRIORITY_EFFECT_GIVER_DEFAULT } = require("../../const/Priority");
const { PRIORITY_OVERTHROW_VOTE } = require("../../const/Priority");

module.exports = class ChoirOfRoles extends Card {
  constructor(role) {
    super(role);

    this.actions = [
      {
        priority: PRIORITY_EFFECT_GIVER_DEFAULT,
        labels: ["effect"],
        run: function () {
          if (this.game.getStateName() != "Night") return;

          if (!this.actor.alive) return;

          let roles = this.game.PossibleRoles.filter((r) => r);
          let players = this.game.alivePlayers().filter(
              (p) => p.role.alignment != "Cult"
            );

          let role = Random.randArrayVal(roles, true).split(":")[0].toLowerCase();
          let victim = Random.randArrayVal(players, true);

           victim.queueAlert(`From your bedroom window you heard the Banshee's wailing about the ${role}. You must say ${role} today or you will be condenmed! If the Banshee guesses your name as their target you will be condenmed anyway so be sneaky!`);
           victim.giveEffect("ChoirSong",this.actor,role,1); //,this.actor,role,1
           this.actor.role.data.singer = victim;
        },
      },
    ];
      
      this.meetings = {
      "Guess Wailer": {
        actionName: "Guess",
        states: ["Day"],
        flags: ["voting"],
        labels: ["hidden", "absolute", "condemn", "overthrow"],
        action: {
          priority: PRIORITY_OVERTHROW_VOTE - 2,
          run: function () {
            
            if(this.target.hasEffect("ChoirSong")){
            for (let action of this.game.actions[0]) {
            if (action.hasLabel("condemn") && !action.hasLabel("overthrow")) {
              // Only one village vote can be overthrown
              action.cancel(true);
              break;
            }
          }

          if (this.dominates(this.target)) {
            this.target.kill("condemn", this.actor);
          }
            }//End if
            
            
          },
        },
      },
    };
    
  }
};
