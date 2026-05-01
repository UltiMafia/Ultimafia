const CoreMeeting = require("../../core/Meeting");

module.exports = class Meeting extends CoreMeeting {
  speak(message) {
    if (this.game && typeof this.game.preprocessMessage === "function") {
      const decision = this.game.preprocessMessage(
        message.sender,
        message.content,
        this
      );

      if (decision && decision.allow === false) return;

      // The Village meeting includes everyone, but the game can restrict who
      // actually receives a given message via decision.recipients (e.g. so
      // post-guess chatter only reaches the drawer + other guessers).
      if (decision && Array.isArray(decision.recipients)) {
        message.recipients = decision.recipients;
      }
    }

    super.speak(message);
  }
};
