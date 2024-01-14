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

  getRoleAppearance(revealType) {
    revealType = revealType || "investigate";
    var appearance = this.getAppearance(revealType);
    var roleName = appearance.split(":")[0];
    var modifiers = appearance.split(":")[1];
    return `${roleName}${modifiers ? ` (${modifiers})` : ""}`;
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

    if (killType === "condemn") {
      this.game.broadcast("condemn");
    }

    if (this.queuedGraveyardParticipationMessage) {
      return;
    }

    if (
      this.game.graveyardParticipation ||
      this.requiresGraveyardParticipation()
    ) {
      this.queueAlert(
        ":system: :star: ATTENTION: :rip: Graveyard participation is required! Please stay in the game."
      );
    } else {
      this.queueAlert(
        ":system: Graveyard participation is not required. You can leave the game."
      );
    }

    this.queuedGraveyardParticipationMessage = true;
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
      sourceMeeting.name === "Pregame" ||
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

  queueGetItemAlert(itemName) {
    let alert = "";
    switch (itemName) {
      case "Gun":
        alert =
          ":gun2: You have received a gun! You can use it during the day to kill one player.";
        break;
      case "Rifle":
        alert =
          ":gun2: You have received a rifle! You can use it during the day to kill one player. If your victim is aligned with you, you will die too. If your victim is of an opposing alignment, you will gain another rifle.";
        break;
      case "Armor":
        alert =
          ":armor: You have received armor! If you are attacked, it will protect you once before breaking.";
        break;
      case "Knife":
        alert =
          ":knife: You have received a knife! Attacking someone will make them bleed, killing them the next day without intervention.";
        break;
      case "Whiskey":
        alert =
          ":beer: You have received a bottle of whiskey! By sharing a drink with someone, they'll be too drunk to take any action tonight.";
        break;
      case "Crystal":
        alert =
          ":crystal: You have received a crystal ball! Scry for the identity of your target; when you die, their role will be revealed.";
        break;
      case "Bread":
        alert =
          ":bread: You have received a piece of bread! It will stave off your hunger for another day...";
        break;
      case "Key":
        alert =
          ":key: You have received a key! You can lock yourself in, preventing anyone from visiting you tomorrow.";
        break;
      case "Candle":
        alert =
          ":candle: You have received a candle! Tonight if anyone visits you, you'll see their face in the candlelight.";
        break;
      case "Falcon":
        alert =
          ":track: You have received a falcon! You can use it to track your target's moves tonight.";
        break;
      case "Tract":
        alert =
          ":bible: You have received a tract! It will protect you once from conversion before being consumed.";
        break;
      case "Syringe":
        alert =
          ":poison: You have received a syringe! Use it on a corpse to bring them back to life!";
        break;
      case "Envelope":
        alert =
          ":message: You have received an envelope! You can write an anonymous message for someone to receive on the next morning.";
        break;
      case "Sceptre":
        alert =
          "You have been chosen to wield the sceptre... You are king for a day!";
        break;
      case "Snowball":
        alert =
          ":snowball: You have received a snowball! You can hit someone with it to freeze them in place.";
        break;
      case "Notebook":
        alert =
          ":journ: You have received a mysterious notebook... try writing down the name of your enemy in it.";
        break;
      case "Doll":
        alert =
          ":doll: You have received a doll... you might want to get rid of it before something bad happens.";
        break;
      case "Timebomb":
        alert =
          ":timebomb: You have received a timebomb. It will explode randomly in the next 10-30 seconds!";
        break;
      case "Cat":
        alert =
          ":cat2: You have received a cat! You can play with the cat and get roleblocked, or let the cat run away and reveal your role to the Cat Lady.";
        break;
      default:
        alert = `You have received a ${itemName}!`;
    }

    this.queueAlert(alert);
  }
};
