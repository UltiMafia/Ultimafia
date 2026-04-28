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

      if (decision && decision.routeTo) {
        let target;
        if (typeof this.game.getMeetingByName === "function") {
          target = this.game.getMeetingByName(decision.routeTo);
        }
        if (!target && this.game.getMeetings) {
          const all = this.game.getMeetings();
          target = all && all.find && all.find((m) => m.name === decision.routeTo);
        }
        if (target) {
          message.recipients = target.getPlayers();
          // Re-dispatch on the routed-to meeting so its own speech rules / member checks apply.
          target.speak(message);
          return;
        }
      }
    }

    super.speak(message);
  }
};
