const Event = require("../Event");
const Action = require("../Action");
const Random = require("../../../../lib/Random");
const {
  EVIL_FACTIONS,
  NOT_EVIL_FACTIONS,
  CULT_FACTIONS,
  MAFIA_FACTIONS,
  FACTION_LEARN_TEAM,
  FACTION_WIN_WITH_MAJORITY,
  FACTION_WITH_MEETING,
  FACTION_KILL,
} = require("../const/FactionList");
const {
  PRIORITY_ITEM_GIVER_DEFAULT,
  PRIORITY_BECOME_DEAD_ROLE,
} = require("../const/Priority");

module.exports = class Necronomicon extends Event {
  constructor(modifiers, game) {
    super("Necronomicon", modifiers, game);
    //this.game.queueAlert(`Supplies ${modifiers}`);
  }

  getNormalRequirements() {
    let cult = this.game.alivePlayers().filter((p) => p.role.alignment == "Cult"));
    if(cult.length <= 0){
      return false;
    }
    if (this.game.Necronomicon == "Active" || this.game.Necronomicon == "Demonic") {
      return false;
    }
    return true;
  }

  doEvent() {
    super.doEvent();
    let victim = Random.randArrayVal(this.game.alivePlayers().filter((p) => CULT_FACTIONS.includes(p.faction)));
    this.action = new Action({
      game: this.game,
      priority: PRIORITY_ITEM_GIVER_DEFAULT,
      labels: ["hidden", "absolute"],
      run: function () {
        if(!this.modifiers.includes("Demonic")){
        if (this.game.SilentEvents != false) {
          this.game.queueAlert(
            `Event: Necronomicon, The Cult now controls the Necronomicon!`
          );
        }
        this.game.Necronomicon = "Active";
        }
        else{
        this.game.Necronomicon = "Demonic";
        }
      },
    });
    this.game.queueAction(this.action);
  }
};
