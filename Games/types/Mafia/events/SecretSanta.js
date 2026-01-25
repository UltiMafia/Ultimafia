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

module.exports = class SecretSanta extends Event {
  constructor(modifiers, game) {
    super("Secret Santa", modifiers, game);
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
      event: this,
      run: function () {
        if (this.game.SilentEvents != false) {
          this.game.queueAlert(
            `Event: Secret Santa! Each player will give an item to another player!`
          );
        }
        let randomPlayers = Random.randomizeArray(this.event.generatePossibleVictims());
        let playersWithGifts = [];
        for(let player of randomPlayers){
            let index = randomPlayers.indexOf(player)+1;
            if(index >= randomPlayers.length){
                index = 0;
            }
            let randomPlayer = randomPlayers[index];
            if(!randomPlayer){
             this.game.queueAlert(
            `Why!`
          );   
            }
            else{
            let item = player.holdItem("SecretGifting", randomPlayer);
            if(this.game.selectedEvent == true){
            this.game.instantMeeting(item.meetings, [player]);
          }
            }
            playersWithGifts.push(randomPlayer);
            //this.game.instantMeeting(item.meetings, [player]);
            /*
            player.joinMeetings(item.meetings);
            for (let meeting of this.game.meetings) {
              meeting.generateTargets();
            }
            item.sendMeetings();
            */
        }
       
      },
    });
    this.action.do();
    //this.game.queueAction(this.action);
  }
};
