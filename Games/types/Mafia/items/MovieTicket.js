const Item = require("../Item");
const Action = require("../Action");
const Random = require("../../../../lib/Random");

module.exports = class MovieTicket extends Item {
  constructor(options) {
    super("MovieTicket");

    this.cannotBeStolen = true;
    this.cannotBeSnooped = true;

    this.meetings = {
      "Attend Movie": {
        actionName: "Attend Movie",
        states: ["Day"],
        flags: ["voting", "instant", "noVeg"],
        inputType: "boolean",
        action: {
          labels: ["kill"],
          item: this,
          run: function () {
             this.item.drop();
            if (this.target != "Yes") return;
            //this.game.broadcast("gunshot");

            if(this.game.MovieWatchers == null){
              this.game.MovieWatchers = [];
            }
            if(this.game.MovieWatchers.length <= 2){
              this.game.MovieWatchers.push(this.actor);
              this.game.queueAlert(
                `${this.actor.name} is attending the movie release!`
              );
            }
            if(this.game.MovieWatchers.length >= 3){
                  this.game.queueAlert(
                `${this.game.MovieWatchers[0].name}, ${this.game.MovieWatchers[1].name}, and ${this.game.MovieWatchers[2].name} will be attending the movie release tonight!`
              );
              this.game.MovieWatchers[0].giveEffect("MovieNight");
              for(let player of this.game.players){
                for(let item of player.items){
                  if(item.name == "MovieTicket"){
                    item.drop();
                  }
                }
              }
            }
          },
        },
      },
    };
  }


  getMeetingName(idx) {
    return `${this.id} ${idx}`;
  }

  getCurrentMeetingName() {
    if (this.currentMeetingIndex === 0) {
      return this.baseMeetingName;
    }

    return this.getMeetingName(this.currentMeetingIndex);
  }

  // increase meeting name index to ensure each meeting name is unique
  incrementMeetingName() {
    let mtg = this.meetings[this.getCurrentMeetingName()];
    delete this.meetings[this.getCurrentMeetingName()];
    this.currentMeetingIndex += 1;
    this.meetings[this.getCurrentMeetingName()] = mtg;
  }
};
