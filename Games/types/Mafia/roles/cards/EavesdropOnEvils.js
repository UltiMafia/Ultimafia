const Card = require("../../Card");
const Message = require("../../../../core/Message");
module.exports = class EavesdropOnEvils extends Card {
  constructor(role) {
    super(role);

    this.meetings = {
      Eavesdropping: {
        states: ["Night"],
        flags: ["anonymous", "speech"],
        canTalk: false,
      },
    };
    this.listeners = {
      message: function (message) {
        if (
          this.game.getStateName() === "Night" &&
          message.meeting &&
          this.game.getMeetingByName("Eavesdropping") &&
          !message.meeting.hasJoined(this.player) &&
          (message.meeting.name == "Mafia" || message.meeting.name == "Cult")
        ) {
          let targetMeeting = this.game.getMeetingByName("Eavesdropping");
          let newMessage = new Message({
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
