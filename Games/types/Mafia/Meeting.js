const Meeting = require("../../core/Meeting");

module.exports = class MafiaMeeting extends Meeting {
  constructor(name, game) {
    super(name, game);
  }

  speak(message) {
    const member = this.members[message.sender.id];

    if (!member.player.alive) {
      if (
        this.name.includes("Village") ||
        this.name.includes("Graveyard") ||
        this.name.includes("Party!") ||
        this.name.includes("Snowstorm")
      ) {
        const defaultRecipients = this.game.players.filter((x) => !x.alive);
        super.speak(message, defaultRecipients);
        return;
      }
    }

    super.speak(message);
  }

  quote(sender, quote) {
    const member = this.members[sender.id];

    if (!member.player.alive) {
      if (
        this.name.includes("Village") ||
        this.name.includes("Graveyard") ||
        this.name.includes("Party!") ||
        this.name.includes("Snowstorm")
      ) {
        const defaultRecipients = this.game.players.filter((x) => !x.alive);
        super.quote(sender, quote, defaultRecipients);
        return;
      }
    }

    super.quote(sender, quote);
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