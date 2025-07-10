const Effect = require("../Effect");
const Action = require("../Action");

module.exports = class Wrangled extends Effect {
  constructor(curser, lifespan) {
    super("Wrangled");
    this.curser = curser;
    this.lifespan = lifespan;

    this.listeners = {
      vote: function (vote) {
        if(this.NotFirstVoter && this.NotFirstSpeaker){
          this.remove();
        }
        if(this.NotFirstVoter == true){
          return;
        }
        if (
          (vote.meeting.name === "Village" ||
            vote.meeting.name === "Room 1" ||
            vote.meeting.name === "Room 2")
        ) {
            if(vote.voter != this.player){
              this.NotFirstVoter = true;
              return;
            }
          let action = new Action({
            actor: this.curser,
            target: this.player,
            game: this.game,
            labels: ["hidden", "investigate", "role"],
            effect: this,
            run: function () {
          let info = this.game.createInformation(
              "RevealInfo",
              this.actor,
              this.game,
              this.target,
              null,
              "Faction"
            );
            info.processInfo();
            info.getInfoRaw();

              this.effect.remove();
            },
          });

          this.game.instantAction(action);
        }
      },
    };
  }

  hear(message){
        if(this.NotFirstVoter && this.NotFirstSpeaker){
          this.remove();
        }
        if(this.NotFirstSpeaker == true){
          return;
        }
    if(!message.isServer && message.sender != this.player){
      this.NotFirstSpeaker = true;
    }
  }

  speak(message) {
        if(this.NotFirstVoter && this.NotFirstSpeaker){
          this.remove();
        }
        if(this.NotFirstSpeaker == true){
          return;
        }
    if (this.NotFirstSpeaker != true) {
          let action = new Action({
            actor: this.curser,
            target: this.player,
            game: this.game,
            labels: ["hidden", "investigate", "role"],
            effect: this,
            run: function () {
          let info = this.game.createInformation(
              "RevealInfo",
              this.actor,
              this.game,
              this.target,
              null,
              "Faction"
            );
            info.processInfo();
            info.getInfoRaw();

              this.effect.remove();
            },
          });

    this.game.instantAction(action);
    }
  }

  
};
