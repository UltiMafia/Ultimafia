const Event = require("../Event");
const { addArticle } = require("../../../core/Utils");
const Action = require("../Action");
const Random = require("../../../../lib/Random");
const {
  PRIORITY_ITEM_GIVER_DEFAULT,
  PRIORITY_INVESTIGATIVE_AFTER_RESOLVE_DEFAULT,
} = require("../const/Priority");

module.exports = class StandUp extends Event {
  constructor(modifiers, game) {
    super("Stand Up", modifiers, game);
  }

  doEvent() {
    super.doEvent();
    let victim = Random.randArrayVal(this.generatePossibleVictims());
    this.action = new Action({
      actor: null,
      target: victim,
      game: this.game,
      event: this,
      priority: PRIORITY_INVESTIGATIVE_AFTER_RESOLVE_DEFAULT - 5,
      labels: ["hidden", "absolute"],
      run: function () {
        
          this.game.queueAlert(
            `Event: Stand Up! All players hear an amazing Joke!`
          );

            let info = this.game.createInformation(
              "GoodOrEvilRoleInfo",
              null,
              this.game,
              this.target
            );
            info.processInfo();

            let roles = info.getInfoRaw();
            roles.push(info.getFakeRole(this.target,1,false,this.investType,"Good"));
            roles = Random.randomizeArray(roles).map((p) => addArticle(p);
            roles = `${roles[0]}, ${roles[1]} and ${roles[2]}`;
            var alert = `:carol: ${roles} walk into a bar, and one of them is ${info.target.name}.`;
            this.game.queueAlert(alert);
      },
    });
    this.game.queueAction(this.action);
  }
};
