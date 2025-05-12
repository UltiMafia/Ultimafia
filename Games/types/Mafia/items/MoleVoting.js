const Item = require("../Item");
const Action = require("../Action");
const { PRIORITY_EFFECT_GIVER_DEFAULT } = require("../const/Priority");
const {
  PRIORITY_INVESTIGATIVE_AFTER_RESOLVE_DEFAULT,
} = require("../const/Priority");
const { MEETING_PRIORITY_HOT_SPRINGS } = require("../const/MeetingPriority");

module.exports = class MoleVoting extends Item {
  constructor(meetingName) {
    super("MoleVoting");

    //this.reveal = reveal;
    this.lifespan = Infinity;
    this.cannotBeStolen = true;
    this.cannotBeSnooped = true;
    this.meetingName = meetingName;
    this.meetings["Guess Mole"] = {
      states: ["Night"],
      flags: ["group", "anonymous", "voting"],
      targets: { include: ["alive", "dead"] },
      whileDead: true,
      whileAlive: true,
      action: {
        labels: ["hidden", "absolute", "group", "multiActor"],
        priority: PRIORITY_INVESTIGATIVE_AFTER_RESOLVE_DEFAULT,
        item: this,
        run: function () {
          //this.target.role.revealToPlayer(this.actor);
          if (!this.game.guessedMoles) {
            this.game.guessedMoles = {};
          }
          this.game.guessedMoles[this.actor.faction] = [];
          if (this.target.hasItem("IsTheMole")) {
            this.game.hasGuessedMole = true;
            this.game.guessedMoles[this.actor.faction].push(this.target);
          }
          for (let player of this.game.players) {
            for (let item of player.items) {
              if (item.name == "MoleVoting") {
                item.drop();
              }
            }
          }
          this.item.drop();
        },
      },
    };
  }
};
