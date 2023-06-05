const Meeting = require("./Meeting");

module.exports = class PregameMeeting extends Meeting {
  constructor(game) {
    super(game, "Pregame");

    this.group = true;
    this.speech = true;
    this.liveJoin = true;
  }

  leave(player) {
    if (this.finished) return;

    delete this.members[player.id];
    player.leftMeeting(this);
  }

  getPlayerMessages(player) {
    return this.messages.reduce((msgs, m) => {
      m = m.getMessageInfo();
      if (m) msgs.push(m);
      return msgs;
    }, []);
  }
};
