const Player = require("../../core/Player");
const Action = require("./Action");
const Random = require("../../../lib/Random");
const nameGen = require("../../../routes/utils").nameGen;
const deathMessages = require("./templates/death");
const revivalMessages = require("./templates/revival");
const roleData = require("../../../data/roles");
const {
  EVIL_FACTIONS,
  NOT_EVIL_FACTIONS,
  CULT_FACTIONS,
  MAFIA_FACTIONS,
  FACTION_LEARN_TEAM,
  FACTION_WIN_WITH_MAJORITY,
  FACTION_WITH_MEETING,
  FACTION_KILL,
} = require("./const/FactionList");

module.exports = class MafiaPlayer extends Player {
  constructor(user, game, isBot) {
    super(user, game, isBot);

    this.deathMessages = deathMessages;
    this.revivalMessages = revivalMessages;
    this.votedForExtension = false;
    this.data.blood = 100;
    this.data.Block = 0;
    this.data.ConversionProgress = 0;
    this.data.Charge = 0;
    this.data.StylePoints = 0;
    this.Gold = 0;
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

        if (this.game.extendLength == 0) {
          this.sendAlert("Extends are disabled.");
          return;
        }

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

        this.game.timers["main"].extend(this.game.extendLength * 60 * 1000);
        this.game.extensions++;
        this.game.extensionVotes = 0;

        for (let player of this.game.players) player.votedForExtension = false;

        this.game.sendAlert("Day extended.");
        return;
      /*
      case "roleshare":
        if (this.game.getStateName() != "Day" || !this.alive) {
          return;
        }
        if (!this.game.isRoleSharing()) {
          this.sendAlert("Role Sharing is not Enabled in this Setup.");
          return;
        }
        if (this.hasEffect("CannotRoleShare")) {
          return;
        }
        for (let player of this.game.players) {
          if (player.name.toLowerCase() === cmd.args[0].toLowerCase()) {
            if (!player.alive) {
              return;
            }
            var action = new Action({
              actor: this,
              target: player,
              game: this.game,
              labels: ["hidden"],
              run: function () {
                if (!this.actor.isInSameRoom(this.target)) {
                  this.actor.queueAlert(
                    `You can only share with players in your Room.`
                  );
                  return;
                }
                this.target.queueAlert(
                  `${this.actor.name} wants to Role Share.`
                );
                this.actor.queueAlert(
                  `You offer to Role Share with ${this.target.name}.`
                );
              },
            });
            this.game.instantAction(action);
            if (!this.isInSameRoom(player)) {
              return;
            }
            let ShareWith = player.holdItem(
              "RoleShareAccept",
              this,
              "Role Share",
              player
            );
            this.game.instantMeeting(ShareWith.meetings, [player]);
            return;
          }
        }
        return;
      case "alignmentshare":
        if (this.game.getStateName() != "Day" || !this.alive) {
          return;
        }
        if (!this.game.isAlignmentSharing()) {
          this.sendAlert("Alignment Sharing is not Enabled in this Setup.");
          return;
        }
        if (this.hasEffect("CannotRoleShare")) {
          return;
        }
        for (let player of this.game.players) {
          if (player.name.toLowerCase() === cmd.args[0].toLowerCase()) {
            if (!player.alive) {
              return;
            }
            var action = new Action({
              actor: this,
              target: player,
              game: this.game,
              labels: ["hidden"],
              run: function () {
                if (!this.actor.isInSameRoom(this.target)) {
                  this.actor.queueAlert(
                    `You can only share with players in your Room.`
                  );
                  return;
                }
                this.target.queueAlert(
                  `${this.actor.name} wants to Alignment Share.`
                );
                this.actor.queueAlert(
                  `You offer to Alignment Share with ${this.target.name}.`
                );
              },
            });
            this.game.instantAction(action);
            if (!this.isInSameRoom(player)) {
              return;
            }
            let ShareWith = player.holdItem(
              "RoleShareAccept",
              this,
              "Alignment Share",
              player
            );
            this.game.instantMeeting(ShareWith.meetings, [player]);
            return;
          }
        }
        return;
      case "privatereveal":
        if (this.game.getStateName() != "Day" || !this.alive) {
          return;
        }
        if (!this.game.isPrivateRevealing()) {
          this.sendAlert("Private Revealing is not Enabled in this Setup.");
          return;
        }
        if (this.hasEffect("CannotRoleShare")) {
          return;
        }
        for (let player of this.game.players) {
          if (player.name.toLowerCase() === cmd.args[0].toLowerCase()) {
            if (!player.alive) {
              return;
            }
            var action = new Action({
              actor: this,
              target: player,
              game: this.game,
              labels: ["hidden"],
              run: function () {
                if (!this.actor.isInSameRoom(this.target)) {
                  this.actor.queueAlert(
                    `You can only Private Reveal to players in your Room.`
                  );
                  return;
                }
                this.target.queueAlert(
                  `${this.actor.name} Private Reveals to you.`
                );
                this.actor.queueAlert(
                  `You Private Reveal to ${this.target.name}.`
                );
                this.actor.role.revealToPlayer(
                  this.target,
                  null,
                  "investigate"
                );
              },
            });
            this.game.instantAction(action);
            return;
          }
        }
        return;
      case "publicreveal":
        if (this.game.getStateName() != "Day" || !this.alive) {
          return;
        }
        if (!this.game.isPublicRevealing()) {
          this.sendAlert("Public Revealing is not Enabled in this Setup.");
          return;
        }
        if (this.hasEffect("CannotRoleShare")) {
          return;
        }
        var action = new Action({
          actor: this,
          game: this.game,
          labels: ["hidden"],
          run: function () {
            for (let player of this.game.alivePlayers()) {
              if (this.actor.isInSameRoom(player)) {
                player.queueAlert(
                  `${this.actor.name} Public Reveals to Everyone.`
                );
                this.actor.role.revealToPlayer(player, null, "investigate");
              }
            }
            //this.actor.role.revealToAll(null, "investigate");
          },
        });
        this.game.instantAction(action);
        return;
        */
    }
  }

  requiresGraveyardParticipation() {
    let data = roleData["Mafia"][this.role.name];
    let tags = this.game.getRoleTags(
      this.game.formatRoleInternal(this.role.name, this.role.modifier)
    );
    if (data.graveyardParticipation === "self") {
      return true;
    } else if (tags.includes("Graveyard Participation")) {
      return true;
    }
  }

  damage(amount, damageType, attacker, instant, reveal, canCrit) {
    if (amount <= 0) {
      return;
    }
    if (damageType == null) {
      damageType == "basic";
    }
    if (this.data.Parry == true) {
      if (reveal == true) {
        this.game.sendAlert(`${this.name} parries the attack!`);
      }
      attacker.damage(
        amount / 2,
        damageType,
        attacker,
        instant,
        reveal,
        canCrit
      );
      amount = amount / 2;
      this.data.Parry = false;
    }
    if (this.data.Block >= amount) {
      this.data.Block = this.data.Block - amount;
      amount = 0;
    } else if (this.data.Block > 0) {
      amount = amount - this.data.Block;
      this.data.Block = 0;
      this.queueAlert(`You now have ${this.data.Block} Block!`);
    }

    if (amount > 0) {
      if (canCrit == true && Random.randInt(1, 20) <= attacker.crit) {
        amount = amount * 2;
      }
      this.data.blood -= amount;
      if (reveal == true) {
        this.game.sendAlert(`${this.name} loses ${amount}% blood!`);
      }
      this.queueAlert(`You now have ${this.data.blood}% blood left!`);
      if (this.data.blood <= 0) {
        this.kill("blood", attacker, instant);
      }
    } else {
      if (reveal == true) {
        this.game.sendAlert(`${this.name} blocks the Attack!`);
      }
      this.queueAlert(`You block the Attack!`);
      this.queueAlert(`You now have ${this.data.Block} Block!`);
    }
    return amount;
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
        ":system: :star: ATTENTION: :rip: Graveyard participation is required! Please stay in the game.",
        undefined,
        undefined,
        ["important"]
      );
    } else {
      this.queueAlert(
        ":system: Graveyard participation is not required. You can leave the game.",
        undefined,
        undefined,
        ["info"]
      );
    }

    this.queuedGraveyardParticipationMessage = true;
  }

  speak(message) {
    let deadPlayers = this.game.players.filter(
      (p) =>
        (!p.alive || p.hasEffect("CanSeeDead")) &&
        !(p.hasEffect("CanSpeakToLiving") && !p.hasEffect("CanSeeDead"))
    );
    if (this.hasEffect("CanSpeakToLiving")) {
      return super.speak(message);
    }
    if (
      !this.alive &&
      this.game.isTalkingDead() != true &&
      (message.meeting.name == "Village" ||
        message.meeting.name == "Room 1" ||
        message.meeting.name == "Room 2" ||
        message.meeting.name == "Leaders" ||
        message.meeting.name == "Graveyard" ||
        message.meeting.name == "Party!")
    ) {
      message.recipients = deadPlayers;
      message.modified = true;
    }

    return super.speak(message);
  }

  speakQuote(quote) {
    let deadPlayers = this.game.players.filter(
      (p) =>
        (!p.alive || p.hasEffect("CanSeeDead")) &&
        !(p.hasEffect("CanSpeakToLiving") && !p.hasEffect("CanSeeDead"))
    );
    if (this.hasEffect("CanSpeakToLiving")) {
      return super.speak(quote);
    }
    if (
      !this.alive &&
      this.game.isTalkingDead() != true &&
      (quote.meeting.name == "Village" ||
        quote.meeting.name == "Room 1" ||
        quote.meeting.name == "Room 2" ||
        quote.meeting.name == "Leaders" ||
        quote.meeting.name == "Graveyard" ||
        quote.meeting.name == "Party!")
    ) {
      quote.recipients = deadPlayers;
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

  joinMeetings(meetings, extraRole) {
    for (let meetingName in meetings) {
      let options = meetings[meetingName];

      if (meetingName === "Party!" && !this.alive) {
        options.flags.push("exclusive");
        break;
      }
    }

    super.joinMeetings(meetings, extraRole);
  }

  queueGetItemAlert(itemName) {
    let alert = "";
    switch (itemName) {
      case "Gun":
        alert = ":gun2: You have received a gun!";
        break;
      case "Rifle":
        alert = ":gun2: You have received a rifle!";
        break;
      case "Armor":
        alert = ":armor: You have received armor!";
        break;
      case "Knife":
        alert = ":knife: You have received a knife!";
        break;
      case "Whiskey":
        alert = ":beer: You have received a bottle of whiskey!";
        break;
      case "Crystal Ball":
        alert = ":crystal: You have received a crystal ball!";
        break;
      case "Bread":
        alert = ":bread: You have received a piece of bread!";
        break;
      case "Key":
        alert = ":key: You have received a key!";
        break;
      case "Candle":
        alert = ":candle: You have received a candle!";
        break;
      case "Falcon":
        alert = ":track: You have received a falcon!";
        break;
      case "Tract":
        alert = ":bible: You have received a tract!";
        break;
      case "Syringe":
        alert = ":poison: You have received a syringe!";
        break;
      case "Envelope":
        alert = ":message: You have received an envelope!";
        break;
      case "Sceptre":
        alert = "You have received a sceptre!";
        break;
      case "Snowball":
        alert = ":snowball: You have received a snowball!";
        break;
      case "Notebook":
        alert = ":journ: You have received a mysterious notebook...";
        break;
      case "Doll":
        alert = ":doll: You have received a doll...";
        break;
      case "Timebomb":
        alert = ":timebomb: You have received a timebomb.";
        break;
      case "Sockpuppet":
        alert = "You have received a sockpuppet!";
        break;
      case "Cat":
        alert = ":cat2: You have received a cat!";
        break;
      default:
        alert = `You have received a ${itemName}!`;
    }

    this.queueAlert(alert);
  }

  isDemonic(ingnoreAppearance) {
    if (ingnoreAppearance != true) {
      if (
        this.getRoleAppearance().split(" (")[1] &&
        this.getRoleAppearance().split(" (")[1].includes("Demonic")
      ) {
        return true;
      }
    }
    if (
      this.game
        .getRoleTags(
          this.game.formatRoleInternal(this.role.name, this.role.modifier)
        )
        .includes("Demonic")
    ) {
      return true;
    }
    if (this.hasItem("Necronomicon") && this.game.Necronomicon == "Demonic") {
      return true;
    }
    return false;
  }

  isEvil() {
    if (player.hasEffect("Misregistration")) {
      let temp = this.game.createInformation("AlignmentInfo", this, this);
      return temp.isAppearanceEvil(this, "investigate");
    }
    if (
      EVIL_FACTIONS.includes(this.faction) ||
      (this.faction == "Independent" &&
        this.game.getRoleTags(this.role.name).includes("Hostile"))
    ) {
      return true;
    }
    return false;
  }

  getNeighbors() {
    let alive = this.game.alivePlayers();
    let index = alive.indexOf(this);

    const leftIdx = (index - 1 + alive.length) % alive.length;
    const rightIdx = (index + 1) % alive.length;
    return [alive[leftIdx], alive[rightIdx]];
  }

  isDelirious() {
    for (let effect of this.effects) {
      if (
        effect.name == "Delirious" &&
        (effect.effecter == null ||
          effect.effecter == this ||
          (effect.effecterRole && effect.effecterRole.hasAbility(effect.types)))
      ) {
        return true;
      }
    }
    return false;
  }

  hasAbility(types) {
    if (types == null) {
      types = [];
    }
    let isRestless =
      this.game
        .getRoleTags(
          this.game.formatRoleInternal(this.role.name, this.role.modifier)
        )
        .includes("Restless") && !this.hasEffect("NoModifiers");
    if (!isRestless) {
      isRestless =
        this.game
          .getRoleTags(
            this.game.formatRoleInternal(this.role.name, this.role.modifier)
          )
          .includes("Vengeful") &&
        !this.hasEffect("NoModifiers") &&
        this.role.HasBeenNightKilled == true;
    }
    let isTransendant =
      this.game
        .getRoleTags(
          this.game.formatRoleInternal(this.role.name, this.role.modifier)
        )
        .includes("Transcendent") && !this.hasEffect("NoModifiers");
    let isRetired =
      this.game
        .getRoleTags(
          this.game.formatRoleInternal(this.role.name, this.role.modifier)
        )
        .includes("Retired") && !this.hasEffect("NoModifiers");
    if (this.exorcised == true) {
      return false;
    }
    if (this.hasEffect("BackUp")) {
      return false;
    }
    if (isRetired == true && !types.includes("Modifier")) {
      return false;
    }
    if (types.includes("OnlyWhenDead") && this.alive == true) {
      return false;
    }
    if (types.includes("OnlyWhenAlive") && this.alive == false) {
      return false;
    }
    if (this.isDelirious() && types.includes("Information") != true) {
      return false;
    }
    if (
      this.alive == false &&
      types.includes("OnlyWhenDead") != true &&
      types.includes("WhenDead") != true &&
      isRestless != true &&
      isTransendant != true
    ) {
      return false;
    }
    if (this.alive == true && isRestless == true) {
      return false;
    }
    if (types.includes("Modifier") && this.hasEffect("NoModifiers")) {
      return false;
    }

    return true;
  }

  getVotePower(meeting) {
    let votePower = this.role.VotePower;
    for (let effect of this.effects) {
      if (effect.name == "VoteIncrease") {
        votePower += effect.Amount;
      } else if (effect.name == "VoteDecrease") {
        votePower -= effect.Amount;
      }
    }
    for (let effect of this.effects) {
      if (effect.name == "VoteNegative") {
        votePower = votePower * -1;
      }
    }
    for (let effect of this.effects) {
      if (effect.name == "Voteless") {
        votePower = 0;
      }
    }
    return votePower;
  }

  isInSameRoom(player) {
    if (this.game.Rooms && this.game.Rooms.length > 0) {
      for (let Room of this.game.Rooms) {
        if (Room.members.includes(this)) {
          if (Room.members.includes(player)) {
            return true;
          } else {
            return false;
          }
        }
      }
    }
    return true;
  }

  customizeMeetingTargets(meeting) {
    let isMorbid = this.game
      .getRoleTags(
        this.game.formatRoleInternal(this.role.name, this.role.modifier)
      )
      .includes("Morbid");
    let isLiminal = this.game
      .getRoleTags(
        this.game.formatRoleInternal(this.role.name, this.role.modifier)
      )
      .includes("Liminal");
    let isSelfish = this.game
      .getRoleTags(
        this.game.formatRoleInternal(this.role.name, this.role.modifier)
      )
      .includes("Selfish");
    let isFair = this.game
      .getRoleTags(
        this.game.formatRoleInternal(this.role.name, this.role.modifier)
      )
      .includes("Fair");
    let isNonconsecutive = this.game
      .getRoleTags(
        this.game.formatRoleInternal(this.role.name, this.role.modifier)
      )
      .includes("Nonconsecutive");
    let isConsecutive = this.game
      .getRoleTags(
        this.game.formatRoleInternal(this.role.name, this.role.modifier)
      )
      .includes("Consecutive");
    let standard = ["alive"];
    let standard2 = ["members"];
    if (isLiminal == true) {
      standard = ["alive", "dead"];
    }
    if (isMorbid == true) {
      standard = ["dead"];
    }
    if (isSelfish == true) {
      standard2 = [];
    }
    if (isConsecutive) {
      if (
        this.role.data.LimitedAllVisits == null ||
        this.role.data.LimitedAllVisits.length <= 0
      ) {
      } else {
        standard = ["previousAll"];
      }
    } else if (isFair) {
      standard2.push("previousAll");
    } else if (isNonconsecutive) {
      standard2.push("previous");
    }
    meeting.targets = { include: standard, exclude: standard2 };
    meeting.targetsDescription = null;
    meeting.generateTargets();
    for (let member of meeting.members) {
      member.player.sendMeeting(meeting);
    }
  }
};
