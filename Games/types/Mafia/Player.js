const Player = require("../../core/Player");
const nameGen = require("../../../routes/utils").nameGen;
const deathMessages = require("./templates/death");
const revivalMessages = require("./templates/revival");
const roleData = require("../../../data/roles");

module.exports = class MafiaPlayer extends Player {
  constructor(user, game, isBot) {
    super(user, game, isBot);

    this.deathMessages = deathMessages;
    this.revivalMessages = revivalMessages;
    this.votedForExtension = false;
    this.data.blood = 100;
  }

  getRevealType(deathType) {
    if (deathType == "condemn") return "condemn";
    else return "death";
  }

  parseCommand(message) {
    var cmd = super.parseCommand(message);

    if (!cmd) return;

    switch (cmd.name) {
      case "extend":
        var vegKickMeeting = super.getVegKickMeeting();
        if (vegKickMeeting !== undefined) {
          return;
        }
        if (
          this.game.getStateName() != "Day" ||
          this.votedForExtension ||
          !this.alive
        )
          return;

        this.votedForExtension = true;
        this.game.extensionVotes++;

        var aliveCount = this.game.alivePlayers().length;
        var votesNeeded = Math.ceil(aliveCount / 2) + this.game.extensions;

        if (votesNeeded > aliveCount) {
          this.sendAlert("Unable to extend the Day further.");
          return;
        }

        this.game.sendAlert(
          `${this.name} voted for an extension of the Day using /extend. ${this.game.extensionVotes}/${votesNeeded} votes.`
        );

        if (this.game.extensionVotes < votesNeeded) return;

        this.game.timers["main"].extend(3 * 60 * 1000);
        this.game.extensions++;
        this.game.extensionVotes = 0;

        for (let player of this.game.players) player.votedForExtension = false;

        this.game.sendAlert("Day extended.");
        return;
    }
  }

  requiresGraveyardParticipation() {
    let data = roleData["Mafia"][this.role.name];
    if (data.graveyardParticipation === "self") {
      return true;
    }
  }

  kill(killType, killer, instant) {
    super.kill(killType, killer, instant);

    if (killType === "lynch") {
      this.game.broadcast("lynch");
    }

    if (
      this.game.graveyardParticipation ||
      this.requiresGraveyardParticipation()
    ) {
      this.queueAlert(
        "Graveyard participation is required. Please stay in the game."
      );
    } else {
      this.queueAlert(
        "Graveyard participation is not required. You can leave the game."
      );
    }
  }

  speak(message) {
    if (
      !this.alive &&
      (message.meeting.name == "Village" ||
        message.meeting.name == "Graveyard" ||
        message.meeting.name == "Party!")
    ) {
      message.recipients = this.game.deadPlayers();
      message.modified = true;
    }

    return super.speak(message);
  }

  speakQuote(quote) {
    if (
      !this.alive &&
      (quote.meeting.name == "Village" ||
        quote.meeting.name == "Graveyard" ||
        quote.meeting.name == "Party!")
    ) {
      quote.recipients = this.game.deadPlayers();
      quote.modified = true;
    }

    quote = super.speakQuote(quote);
    if (!quote) {
      return;
    }

    let sourceMeeting = this.game.getMeeting(
      quote.fromMeetingId,
      quote.fromState
    );
    if (
      sourceMeeting.name === "Village" ||
      sourceMeeting.name === quote.meeting.name
    ) {
      return quote;
    }

    quote.cancel = true;
    return;
  }

  joinMeetings(meetings) {
    for (let meetingName in meetings) {
      let options = meetings[meetingName];

      if (meetingName === "Party!" && !this.alive) {
        options.flags.push("exclusive");
        break;
      }
    }

    super.joinMeetings(meetings);
  }

  queueGetItemAlert(itemName, target) {
    target = target || this.target;

    let alert = "";
    switch (itemName) {
      case "Gun":
        alert = ":sy2h: You have received a gun!";
        break;
      case "Armor":
        alert = ":armor: You have received armor!";
        break;
      case "Knife":
        alert = ":sy3h: You have received a knife!";
        break;
      case "Snowball":
        alert = ":sy8b: You have received a snowball!";
        break;
      case "Crystal":
        alert = ":sy1i: You have received a crystal ball!";
        break;
      case "Bread":
        alert = ":sy2c: You have received a piece of bread!";
        break;
      case "Timebomb":
        alert =
          "You have received a timebomb. It will explode randomly in the next 10-30 seconds!";
        break;
      case "Cat":
        alert = ":sy9b: You have received a cat!";
        break;
      default:
        alert = `You have received a ${itemName}!`;
    }

    target.queueAlert(alert);
  }
};
