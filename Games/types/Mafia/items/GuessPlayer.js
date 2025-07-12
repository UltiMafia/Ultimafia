const Item = require("../Item");
const Action = require("../Action");
const Random = require("../../../../lib/Random");
const { PRIORITY_OVERTHROW_VOTE } = require("../const/Priority");

module.exports = class GuessPlayer extends Item {
  constructor(player) {
    super("GuessPlayer");
    this.playerToGuess = player;
    this.baseMeetingName = "Guess "+player.name;
    this.currentMeetingIndex = 0;
    this.lifespan = 1;
    this.cannotBeStolen = true;
    this.cannotBeSnooped = true;

    this.meetings = {
      [this.baseMeetingName]: {
        actionName: "Guess Ogre",
        states: ["Day"],
        flags: ["voting", "instant", "noVeg"],
        targets: { include: ["alive", "dead"], exclude: ["self"] },
        action: {
          item: this,
          run: function () {
            this.item.drop();
            if (this.target == this.item.playerToGuess) {
              var action = new Action({
                actor: this.actor,
                target: this.target,
                game: this.actor.game,
                item: this.item,
                priority: PRIORITY_OVERTHROW_VOTE - 1,
                labels: ["hidden", "absolute", "condemn", "overthrow"],
                run: function () {
                  //New code
                  if (!this.item.playerToGuess.hasAbility(["Condemn"])) {
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
                this.actor.queueAlert(`Your guess was Incorrect. No Evil Player will get to Guess the Orge tomorrow!`);
                this.item.playerToGuess.role.OrgeGuessUsedYesterday = true;
              
            }
          },
        },
      },
    };
  }

  get snoopName() {
    return this.name;
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
