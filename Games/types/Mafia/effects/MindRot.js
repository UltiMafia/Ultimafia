const Effect = require("../Effect");
const Action = require("../Action");
const Random = require("../../../../lib/Random");
const { PRIORITY_NIGHT_ROLE_BLOCKER } = require("../const/Priority");

module.exports = class MindRot extends Effect {
  constructor(doer,lifespan) {
    super("MindRot");
    this.doer = doer;
    this.lifespan = lifespan || 1;
  }

  apply(player) {
    super.apply(player);

    this.action = new Action({
      actor: this.doer,
      target: player,
      labels: ["block","effect"],
      priority: PRIORITY_NIGHT_ROLE_BLOCKER + 1,
      effect: this,
      game: this.game,
      run: function () {
            if (this.game.getStateName() != "Night") return;
            let actionCount = false;
            for (const action of this.game.actions[0]) {
              if (action.actor === this.target && !action.hasLabel("investigate")) {
                action.cancelActor(target);
              }
              else if(action.actor === this.target && action.hasLabel("investigate")){
                actionCount = true;
              }
            }

        if(actionCount){
           let visits = this.getVisits(this.target);

          var evilPlayers = alive.filter(
              (p) => p.role.alignment == "Mafia" || p.role.alignment == "Cult"
            );
             var goodPlayers = alive.filter(
              (p) => p.role.alignment != "Mafia" && p.role.alignment != "Cult");

        if(visits.length == 0){
          let neighbors = this.target.getAliveNeighbors();
          let neighborTarget = Random.randArrayVal(neighbors);
            if(neighborTarget.role.alignment == "Village" && this.actor.role.alignment != "Village"){
              neighborTarget.setTempAppearance("investigate", this.actor.role);
            }
            else if(neighborTarget.role.alignment != "Village"){
              neighborTarget.setTempAppearance("investigate", Random.randArrayVal(goodPlayers).role);
            }
            else{
              neighborTarget.setTempAppearance("investigate", Random.randArrayVal(evilPlayers).role);
            }
        }
          else{
          for (const vist of visits){
            if(visit.role.alignment == "Village" && this.actor.role.alignment != "Village"){
              vist.setTempAppearance("investigate", this.actor.role);
            }
            else if(visit.role.alignment != "Village"){
              vist.setTempAppearance("investigate", Random.randArrayVal(goodPlayers).role);
            }
            else{
              vist.setTempAppearance("investigate", Random.randArrayVal(evilPlayers).role);
            }
          }
          }
          
        }
        
        
      },
    });

    this.game.queueAction(this.action);
  }

  remove() {
    super.remove();
    this.action.cancel();
  }
};
