const Meeting = require("../../core/Meeting");
const Message = require("../../core/Message");

module.exports = class AshbrookMeeting extends Meeting {
  constructor(name, game) {
    super(name, game);
  }

  speak(message) {
    var member = this.members[message.sender.id];

    if (
      !member ||
      !this.speech ||
      !member.canTalk ||
      (!(this.members.length > 1) && this.name != "Pregame")
    ) {
      return;
    }

    if (
      message.abilityName == "Whisper" &&
      this.game.setup.whispers &&
      this.name != "Pregame" &&
      !this.anonymous
    ) {
      var recipientMember = this.members[message.abilityTarget];

      if (!recipientMember) return;

      message.recipients = [recipientMember.player, message.sender];
      message.prefix = `whispers to ${recipientMember.player.name}`;

      let leakChance = -1;

      if (!this.game.enableWhisper) leakChance = 100;

      if (leakChance > 0) message.recipients = this.getPlayers();
    }

    if (!message.recipients) message.recipients = this.getPlayers();

    if (message.recipients.length == 0) return;

    message = new Message({
      sender: message.sender,
      content: message.content,
      game: this.game,
      meeting: this,
      recipients: message.recipients,
      prefix: message.prefix,
      abilityName: message.abilityName,
      abilityTarget: message.abilityTarget,
      anonymous: this.anonymous,
    });

    message.send();
  }

  finish(isVote) {
    super.finish(isVote);

    // for (let member of this.members) {
    //     if (this.votes[member.id])
    //         member.player.recordStat("participation", true);
    //     else
    //         member.player.recordStat("participation", false);
    // }
  }
};
