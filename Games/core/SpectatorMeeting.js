const Meeting = require("./Meeting");

module.exports = class SpectatorMeeting extends Meeting {
  constructor(game) {
    super(game, "Spectator Meeting");
    this.group = true;
    this.speech = false; 
    this.liveJoin = true;
    this.voting = false;
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
