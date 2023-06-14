const Card = require("../../Card");
const { PRIORITY_DAY_DEFAULT } = require("../../const/Priority");
const Message = require("../../../../core/Message");

module.exports = class Eavesdrop extends Card {
  constructor(role) {
    super(role);

    this.meetings = {
      "Eavesdrop On": {
        states: ["Day"],
        flags: ["voting"],
        action: {
          labels: ["eavesdrop"],
          priority: PRIORITY_DAY_DEFAULT,
          run() {
            this.actor.role.data.stalk = this.target;
          },
        },
      },
      Eavesdropping: {
        states: ["Night"],
        flags: ["anonymous", "speech"],
        canTalk: false,
        shouldMeet() {
          return this.data.stalk;
        },
      },
    };
    this.actions = [
      {
        labels: ["hidden", "absolute"],
        run() {
          if (this.game.getStateName() === "Night")
            delete this.actor.role.data.stalk;
        },
      },
    ];
    this.listeners = {
      message(message) {
        if (
          this.game.getStateName() === "Night" &&
          message.meeting &&
          this.game.getMeetingByName("Eavesdropping") &&
          message.meeting.hasJoined(this.data.stalk) &&
          !message.meeting.hasJoined(this.player)
        ) {
          const targetMeeting = this.game.getMeetingByName("Eavesdropping");
          const newMessage = new Message({
            meeting: targetMeeting,
            anonymous: true,
            content: message.content,
            game: this.game,
            recipients: targetMeeting.getPlayers(),
          });
          newMessage.send();
        }
      },
    };
  }
};
