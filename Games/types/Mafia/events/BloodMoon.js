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

module.exports = class BloodMoon extends Event {
  constructor(modifiers, game) {
    super("Blood Moon", modifiers, game);
  }

  doEvent() {
    super.doEvent();

    let victim = Random.randArrayVal(this.generatePossibleVictims());
    this.action = new Action({
      actor: victim,
      target: victim,
      game: this.game,
      priority: PRIORITY_ITEM_GIVER_DEFAULT,
      labels: ["hidden", "absolute"],
      run: function () {
        if (this.game.SilentEvents != false) {
          this.game.queueAlert(
            `Event: Blood Moon! The game will end the following day! Village must kill a member of each Evil faction to win!`
          );
        }
        this.game.IsBloodMoon = true;

        if(this.game.BloodMoonKills == null){
          this.game.BloodMoonKills = [];
        }

            const CULT_IN_GAME =
            this.game.players.filter((p) => CULT_FACTIONS.includes(p.faction))
              .length > 0;
          const MAFIA_IN_GAME =
            this.game.players.filter((p) => MAFIA_FACTIONS.includes(p.faction))
              .length > 0;
          const SUPERHERO_IN_GAME =
            this.game.players.filter((p) => p.role.name == "Superhero").length >
            0;

            if (MAFIA_IN_GAME && CULT_IN_GAME) {
              for (let player of this.game.players) {
                player.holdItem("ExtraCondemn", "Extra Condemn");
              }
            }
          
            if (
              this.game.IsBloodMoon &&
              (MAFIA_IN_GAME || CULT_IN_GAME) &&
              SUPERHERO_IN_GAME
            ) {
              for (let player of this.game.players) {
                player.holdItem("ExtraCondemn", "Bonus Condemn");
              }
            }
        
      },
    });
    this.action.do();
    //this.game.queueAction(this.action);
  }
};
