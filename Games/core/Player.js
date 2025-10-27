const shortid = require("shortid");
const nameGen = require("../../routes/utils").nameGen;
const History = require("./History");
const Message = require("./Message");
const Quote = require("./Quote");
const Utils = require("./Utils");
const Spam = require("./Spam");
const deathMessages = require("./death");
const revivalMessages = require("./revival");
const constants = require("../../data/constants");
const logger = require("../../modules/logging")("games");
const dbStats = require("../../db/stats");
const roleData = require("../../data/roles");
const gameAchievements = require("../../data/Achievements");
const DailyChallengeData = require("../../data/DailyChallenge");
const itemData = require("../../data/items");
const modifierData = require("../../data/modifiers");
const commandData = require("../../data/commands");
const axios = require("axios");

module.exports = class Player {
  constructor(user, game, isBot) {
    this.id = shortid.generate();
    user.settings = user.settings ?? {};
    this.user = user;
    this.user.player = this;
    this.socket = user.socket;
    this.name = user.name || nameGen();
    this.game = game;
    this.isBot = isBot;
    this.events = game.events;
    this.role = null;
    this.faction = null;
    this.factionFake = null;
    this.alive = true;
    this.exorcised = false;
    this.data = {};
    this.items = [];
    this.startingItems = [];
    this.effects = [];
    this.passiveEffects = [];
    this.AchievementTracker = [];
    this.DailyTracker = [];
    this.EarnedAchievements = [];
    this.DailyPayout = 0;
    this.DailyCompleted = 0;
    this.CompletedDailyChallenges = [];
    this.tempImmunity = {};
    this.tempAppearance = {};
    this.tempAppearanceMods = {};
    this.history = new History(this.game, this);
    this.ready = false;
    this.won = false;
    this.deathMessages = deathMessages;
    this.revivalMessages = revivalMessages;
    this.docImmunity = [];
    this.ExtraRoles = [];
    this.passiveExtraRoles = [];
  }

  init() {
    this.socketListeners();

    // Configure temporary immunity reset
    this.game.events.on("afterActions", () => {
      this.tempImmunity = {};
      this.tempAppearance = {};
    });
  }

  makeAnonymous(deckProfile) {
    this.originalProfile = {
      id: this.id,
      userId: this.user.id,
      name: this.name,
      textColor: this.user.textColor,
      nameColor: this.user.nameColor,
      hasAvatar: this.user.avatar,
      customEmotes: this.user.customEmotes,
    };

    this.id = shortid.generate();
    this.anonId = deckProfile.id;
    this.name = deckProfile.name;
    this.user.avatar = deckProfile.avatar;
    this.user.textColor = deckProfile.color;
    this.user.settings.deathMessage = deckProfile.deathMessage;
    delete this.user.id;
    delete this.user.nameColor;
    delete this.user.customEmotes;
  }

  makeNotAnonymous() {
    let p = this.originalProfile;

    this.game.sendAlert(
      `${p.name}'s anonymous name was ${this.name}.`,
      undefined,
      undefined,
      ["info"]
    );

    this.user.id = p.userId;
    this.name = p.name;
    this.user.avatar = p.hasAvatar;
    this.user.textColor = p.textColor;
    this.user.nameColor = p.nameColor;
    this.user.customEmotes = p.customEmotes;
    delete this.anonId;
  }

  async handleError(e) {
    var stack = e.stack.split("\n").slice(0, 6).join("\n");
    const discordAlert = JSON.parse(process.env.DISCORD_ERROR_HOOK);
    await axios({
      method: "post",
      url: discordAlert.hook,
      data: {
        content: `Error stack: \`\`\` ${stack}\`\`\`\nSetup: ${this.game.setup.name} (${this.game.setup.id})\nGame Link: ${process.env.BASE_URL}/game/${this.game.id}/review`,
        username: "Errorbot",
        attachments: [],
        thread_name: `Game Error! ${e}`,
      },
    });
  }

  socketListeners() {
    const socket = this.socket;
    var speechPast = [];
    var votePast = [];

    socket.on("speak", (message) => {
      try {
        if (typeof message != "object") return;

        message.content = String(message.content);
        message.meetingId = String(message.meetingId) || "";
        message.abilityName = String(message.abilityName || "");
        message.abilityTarget = String(message.abilityTarget || "");

        if (!Utils.validProp(message.meetingId)) return;

        if (!Utils.validProp(message.abilityName)) return;

        if (!Utils.validProp(message.abilityTarget)) return;

        if (message.content.length == 0) return;

        if (!message.abilityName) delete message.abilityName;

        if (!message.abilityTarget) delete message.abilityTarget;

        message.content = message.content.slice(
          0,
          constants.maxGameMessageLength
        );

        if (
          Spam.rateLimit(
            speechPast,
            constants.msgSpamSumLimit,
            constants.msgSpamRateLimit
          )
        ) {
          this.sendAlert("You are speaking too quickly!");
          return;
        }

        if (
          message.content[0] == "/" &&
          message.content.slice(0, 4) != "/me "
        ) {
          this.parseCommand(message);
          return;
        }

        speechPast.push(Date.now());

        var meeting = this.game.getMeeting(message.meetingId);
        if (!meeting) return;

        meeting.speak({
          sender: this,
          content: message.content,
          abilityName: message.abilityName,
          abilityTarget: message.abilityTarget,
          forceLeak: message.forceLeak,
        });
      } catch (e) {
        logger.error(e);
        // this.handleError(e);
      }
    });

    socket.on("quote", (quote) => {
      try {
        if (typeof quote != "object") return;

        quote.messageId = String(quote.messageId);
        quote.toMeetingId = String(quote.toMeetingId);
        quote.fromMeetingId = String(quote.fromMeetingId);
        quote.fromState = String(quote.fromState);
        quote.messageContent = String(quote.messageContent);

        if (!Utils.validProp(quote.messageId)) return;

        if (!Utils.validProp(quote.toMeetingId)) return;

        if (!Utils.validProp(quote.fromMeetingId)) return;

        if (!Utils.validProp(quote.fromState)) return;

        if (
          Spam.rateLimit(
            speechPast,
            constants.msgSpamSumLimit,
            constants.msgSpamRateLimit
          )
        ) {
          this.sendAlert("You are speaking too quickly!");
          return;
        }

        speechPast.push(Date.now());

        var meeting = this.game.getMeeting(quote.toMeetingId);
        if (!meeting) return;

        meeting.quote(this, quote);
      } catch (e) {
        logger.error(e);
        // this.handleError(e);
      }
    });

    socket.on("vote", (vote) => {
      try {
        if (typeof vote != "object") return;

        vote.selection = String(vote.selection);
        vote.meetingId = String(vote.meetingId);

        if (!Utils.validProp(vote.selection)) return;

        if (!Utils.validProp(vote.meetingId)) return;

        if (
          !this.user.isTest &&
          Spam.rateLimit(
            votePast,
            constants.voteSpamSumLimit,
            constants.voteSpamRateLimit
          )
        ) {
          this.sendAlert("You are voting too quickly!");
          return;
        }

        votePast.push(Date.now());

        var meeting = this.game.getMeeting(vote.meetingId);
        if (!meeting) return;

        const gameStateBeforeVote = this.game.currentState;
        meeting.vote(this, vote.selection);

        // This if statement prevents meetings from being sent if the player's vote caused the state to change
        if (gameStateBeforeVote === this.game.currentState) {
          this.sendMeeting(meeting);
        }
      } catch (e) {
        logger.error(e);
        // this.handleError(e);
      }
    });

    socket.on("unvote", (info) => {
      try {
        if (typeof info != "object") return;

        const meetingId = String(info.meetingId);
        const target = String(info.selection);

        if (!Utils.validProp(meetingId)) return;

        var meeting = this.game.getMeeting(meetingId);
        if (!meeting) return;

        meeting.unvote(this, target);
        this.sendMeeting(meeting);
      } catch (e) {
        logger.error(e);
        // this.handleError(e);
      }
    });

    socket.on("lastWill", (will) => {
      try {
        if (!this.game.isLastWills()) return;

        if (this.game.type == "Mafia" && this.game.getStateName() == "Day")
          return;

        will = String(will).slice(0, constants.maxWillLength);
        will = this.processWill(will);
        this.lastWill = will;
      } catch (e) {
        logger.error(e);
        // this.handleError(e);
      }
    });

    socket.on("typing", (info) => {
      try {
        if (typeof info != "object") return;

        const meetingId = String(info.meetingId);
        const isTyping = Boolean(info.isTyping);

        if (!Utils.validProp(meetingId)) return;

        var meeting = this.game.getMeeting(meetingId);
        if (!meeting) return;

        meeting.typing(this.id, isTyping);
      } catch (e) {
        logger.error(e);
        // this.handleError(e);
      }
    });

    socket.on("slurDetected", () => {
      this.sendAlert(
        "Warning: Your message contains inappropriate language. Please revise your message without using offensive terms."
      );
    });

    socket.on("leave", () => {
      try {
        this.game.playerLeave(this);

        if (this.alive) this.game.sendAlert(`${this.name} has left.`);
      } catch (e) {
        logger.error(e);
        // this.handleError(e);
      }
    });
  }

  processWill(will) {
    var newLineArr = will.split("\n");
    will =
      newLineArr.slice(0, constants.maxWillNewLines).join("\n") +
      newLineArr.slice(constants.maxWillNewLines).join(" ");
    return will;
  }

  // Checks that player has voted in all meetings except the vegkick meeting.
  // This function is used during the vegkick meeting, so vegkickmeeting should not be undefined.
  hasVotedInAllMeetings() {
    let allMeetings = this.getMeetings();
    let vegKickMeetingId = this.getVegKickMeeting()?.id;

    for (let meeting of allMeetings) {
      if (meeting.id === vegKickMeetingId) {
        continue;
      }

      if (meeting.finished) {
        continue;
      }

      // player has not voted
      if (
        meeting.voting &&
        meeting.members[this.id].canVote &&
        meeting.members[this.id].canUpdateVote &&
        meeting.votes[this.id] === undefined
      ) {
        return false;
      }
    }

    return true;
  }

  hasVotedInAllCoreMeetings() {
    let allMeetings = this.getMeetings();
    let vegKickMeetingId = this.getVegKickMeeting()?.id;

    for (let meeting of allMeetings) {
      if (meeting.id === vegKickMeetingId) {
        continue;
      }

      if (meeting.Important != true) {
        continue;
      }

      if (meeting.finished) {
        continue;
      }

      // player has not voted
      if (
        meeting.voting &&
        meeting.members[this.id].canVote &&
        meeting.members[this.id].canUpdateVote &&
        meeting.votes[this.id] === undefined
      ) {
        return false;
      }
    }

    return true;
  }

  getVegKickMeeting() {
    return this.game.vegKickMeeting;
  }

  parseCommand(message) {
    var split = message.content.replace("/", "").split(" ");
    var cmd = {
      raw: message,
      name: split[0],
      args: split.slice(1, split.length),
      text: split.slice(1, split.length).join(" "),
    };

    switch (cmd.name) {
      case "role":
        const roleNameToQuery = cmd.args
          .map((x) => Utils.pascalCase(x))
          .join(" ");
        const role = roleData[this.game.type][roleNameToQuery];
        if (!role) {
          this.sendAlert(
            `:system: Could not find the role ${roleNameToQuery}.`
          );
          return;
        }

        this.sendAlert(
          `:system: Role Info for ${roleNameToQuery} (${
            role.alignment
          }) | ${role.description.join(" ")}`
        );
        return;
      case "item":
        const itemNameToQuery = cmd.args
          .map((x) => Utils.pascalCase(x))
          .join(" ");
        const item = itemData[this.game.type][itemNameToQuery];
        if (!item) {
          this.sendAlert(
            `:system: Could not find the item ${itemNameToQuery}.`
          );
          return;
        }
        this.sendAlert(
          `:system: Item Info for ${itemNameToQuery}| ${item.description}`
        );
        return;
      case "modifier":
        const modifierNameToQuery = cmd.args
          .map((x) => Utils.pascalCase(x))
          .join(" ");
        const modifier = modifierData[this.game.type][modifierNameToQuery];
        if (!modifier) {
          this.sendAlert(
            `:system: Could not find the modifier ${modifierNameToQuery}.`
          );
          return;
        }
        this.sendAlert(
          `:system: Modifier Info for ${modifierNameToQuery}| ${modifier.description}`
        );
        return;
      case "help":
        for (let x = 0; x < Object.entries(commandData).length; x++) {
          this.sendAlert(
            `:system: ${Object.entries(commandData)[x][0]}| ${
              Object.entries(commandData)[x][1].description
            }`
          );
        }
        return;
      case "achievement":
        const achievementNameToQuery = cmd.args
          .map((x) => Utils.pascalCase(x))
          .join(" ");
        const achievement =
          gameAchievements[this.game.type][achievementNameToQuery];
        if (!achievement) {
          this.sendAlert(
            `:system: Could not find the Achievement ${achievementNameToQuery}.`
          );
          return;
        }
        let hasComplete;
        if (this.user.achievements.includes(achievement.ID)) {
          hasComplete = "You have completed this achievement.";
        } else {
          hasComplete = "You have not completed this achievement.";
        }
        this.sendAlert(
          `:system: Achievement Info for ${achievementNameToQuery}- ${achievement.description}| ${hasComplete}`
        );
        return;
      case "daily":
        let dailyInfo = [];
        let tempDailyChallenge = this.user.dailyChallenges.map((d) => d[0]);
        for (let Challenge of Object.entries(DailyChallengeData).filter(
          (DailyChallenge) => tempDailyChallenge.includes(DailyChallenge[1].ID)
        )) {
          let extraData;
          for (let day of this.user.dailyChallenges) {
            if (day[0] == Challenge[1].ID) {
              /*
          this.sendAlert(
            `:system: day 0 ${day[0]} day 1 ${day[1]} day 2 ${day[2]}`
          );
          */
              extraData = day[2];
              dailyInfo.push(
                `${Challenge[0].replace(
                  `ExtraData`,
                  extraData
                )}: ${Challenge[1].description.replace(`ExtraData`, extraData)}`
              );
            }
          }
        } //End For Loop
        /*
       this.sendAlert(
            `:system: ${this.user.dailyChallenges.join(", ")}`
          );
          */

        if (dailyInfo.length <= 0) {
          this.sendAlert(`:system: No daily challenges.`);
          return;
        }
        for (let info of dailyInfo) {
          this.sendAlert(`:system: ${info}`);
        }
        return;
      case "ban":
      case "kick":
        // Allow /kick to be used to kick players during veg votekick.
        if (cmd.name == "kick") {
          var vegKickMeeting = this.getVegKickMeeting();
          if (vegKickMeeting !== undefined) {
            vegKickMeeting.vote(this, "Kick");
            return;
          }
        }

        if (
          this.game.started ||
          this.user.id != this.game.hostId ||
          cmd.args.length == 0
        )
          return;

        if (this.game.competitive) {
          this.sendAlert("You cannot kick players from competitive games.");
          return;
        }

        const kickPermanently = cmd.name == "ban";
        const andBanned = kickPermanently ? "and banned " : "";

        for (let player of this.game.players) {
          if (player.name.toLowerCase() === cmd.args[0].toLowerCase()) {
            this.game.kickPlayer(player, kickPermanently);
            this.game.sendAlert(
              `${player.name} was kicked ${andBanned}from the game.`,
              undefined,
              undefined,
              ["info"]
            );
            return;
          }
        }
        return;
      case "changeSetup":
        const setupToQuery = cmd.args;
        if (
          this.game.started ||
          this.user.id != this.game.hostId ||
          cmd.args.length == 0
        ) {
          return;
        }
        if (this.game.canChangeSetup() != true) {
          this.game.sendAlert(`The setup cannot be changed.`);
          return;
        }
        this.game.changeSetup(setupToQuery);
        return;
      case "diceroll":
        /* Code for cooldown, but it's not needed since only user can see the result :(

        if (this.dicerollCooldown == true) {
          this.sendAlert(`This command has a 5 seconds cooldown, wait plz`);
          return;
        }
        this.dicerollCooldown = true;
        setTimeout(() => {
          this.dicerollCooldown = false;
        }, 5000);
        
        */

        let amountOfRolls = 1;
        let diceType = 6;

        if (cmd.args.length == 1) {
          amountOfRolls = cmd.args[0];
        } else if (cmd.args.length >= 2) {
          amountOfRolls = cmd.args[0];
          diceType = cmd.args[1];
        }

        if (isNaN(amountOfRolls) || amountOfRolls < 0) {
          amountOfRolls = 1;
        }

        if (isNaN(diceType) || diceType < 0) {
          diceType = 6;
        }

        if (amountOfRolls > 10) {
          amountOfRolls = 10;
        }

        if (diceType > 100) {
          diceType = 100;
        }

        let rollsOutput =
          `${this.name} rolled d` +
          diceType +
          ` dice ` +
          amountOfRolls +
          ` times and got `;

        for (let i = 0; i < amountOfRolls; i++) {
          let roll = Math.floor(Math.random() * diceType) + 1;

          if (i === amountOfRolls - 1) {
            rollsOutput += roll + ".";
          } else {
            rollsOutput += roll + ", ";
          }
        }

        this.sendAlert(rollsOutput);

        return;

      case "Nightorder":
        if (!this.game.started) {
          this.sendAlert(`This command can only be used during the game`);
          return;
        }
        if (this.nightorderCooldown == true) {
          this.sendAlert(`This command has a 5 seconds cooldown, wait plz`);
          return;
        }
        if (this.game.type != "Mafia") {
          this.sendAlert(`This command is only supported in Mafia games`);
          return;
        }
        this.nightorderCooldown = true;
        setTimeout(() => {
          this.nightorderCooldown = false;
        }, 5000);

        this.sendAlert(`The Night Order is: ${this.game.NightOrder}`);

        return;
    }

    return cmd;
  }

  send(eventName, data) {
    this.socket.send(eventName, data);
  }

  setUser(user, ignoreSwap) {
    if (!this.user.swapped || ignoreSwap) {
      this.socket.send("left");
      this.socket.terminate();

      if (this.user) this.user.socket = user.socket;
      else this.user = user;

      this.socket = user.socket;

      this.socketListeners();
      return this;
    } else return this.user.swapped.player.setUser(user, true);
  }

  getPlayerInfo(recipient) {
    if (recipient && recipient.id == null) recipient = null;

    var info = {
      id: this.id,
      anonId: this.anonId,
      name: this.name,
      userId: this.user.id,
      avatar: this.user.avatar,
      textColor: this.user.textColor,
      nameColor: this.user.nameColor,
      customEmotes: this.user.customEmotes,
      birthday: this.user.birthday,
    };

    return info;
  }

  setRole(roleName, roleData, noReveal, noAlert, noEmit, faction, items) {
    const modifiers = roleName.split(":")[1];
    roleName = roleName.split(":")[0];

    for (let extraRole of this.passiveExtraRoles) {
      var index = this.ExtraRoles.indexOf(extraRole);
      if (index != -1) {
        this.ExtraRoles.splice(index, 1);
      }
      extraRole.remove();
    }
    this.passiveExtraRoles = [];
    for (let effect of this.passiveEffects) {
      effect.remove();
    }
    this.passiveEffects = [];
    for (let effect of this.effects) {
      if (effect.name == "Blind" && effect.lifespan == Infinity) {
        effect.remove();
      } else if (
        effect.name == "Braggadocious" &&
        effect.lifespan == Infinity
      ) {
        effect.remove();
      } else if (
        effect.name == "Condemn Immune" &&
        effect.lifespan == Infinity
      ) {
        effect.remove();
      } else if (
        effect.name == "Convert Immune" &&
        effect.lifespan == Infinity
      ) {
        effect.remove();
      } else if (effect.name == "Immortal" && effect.lifespan == Infinity) {
        effect.remove();
      } else if (
        effect.name == "Leak Whispers" &&
        effect.lifespan == Infinity
      ) {
        effect.remove();
      } else if (effect.name == "Save Immune" && effect.lifespan == Infinity) {
        effect.remove();
      } else if (effect.name == "Scrambled" && effect.lifespan == Infinity) {
        effect.remove();
      } else if (effect.name == "Tree" && effect.lifespan == Infinity) {
        effect.remove();
      }
    }
    if (items == "RemoveStartingItems") {
      for (let item of this.startingItems) {
        item.drop();
      }
      this.startingItems = [];
    }
    if (!faction) {
      this.faction = this.game.getRoleAlignment(roleName);

      //this.faction = this.game.getRoleAlignment(roleName);
    } else if (faction != "No Change") {
      this.faction = faction;
    }

    if (this.faction == "Independent") {
      this.faction = this.game.getRoleAlignment(roleName);
    }

    const role = this.game.getRoleClass(roleName);

    let oldAppearanceSelf = this.role?.appearance.self;
    this.removeRole();
    this.role = new role(this, roleData);
    if (items == "NoStartingItems") {
      this.role.startItems = [];
    }
    this.role.init(modifiers);

    if (this.game.started == true && this.game.isHiddenConverts() == true) {
      noReveal = true;
    }

    if (
      !(
        noReveal ||
        (oldAppearanceSelf && oldAppearanceSelf === this.role.appearance.self)
      )
    ) {
      this.role.revealToSelf(noAlert);
    }
    if (this.game.started && !noEmit) {
      this.game.events.emit("roleAssigned", this);
    }
    this.game.events.emit("AbilityToggle", this);
    if (this.game.achievementsAllowed()) {
      for (let achievement of Object.entries(
        gameAchievements[this.game.type]
      ).filter(
        (achievementData) =>
          !this.user.achievements.includes(achievementData[1].ID)
      )) {
        let atemp = this.AchievementTracker.filter(
          (a) => a.name == achievement[0]
        );
        if (
          (achievement[1].roles == null ||
            achievement[1].roles.includes(this.role.name)) &&
          atemp.length <= 0
        ) {
          let internal = achievement[1].internal;

          let aClass = Utils.importGameClass(
            this.game.type,
            "achievements",
            `${internal}`
          );
          let temp = new aClass(achievement[0], this);
          this.AchievementTracker.push(temp);
          temp.start();
        }
      } //End For Loop
    }
    if (this.game.hasIntegrity && this.DailyTracker.length <= 0) {
      let tempDailyChallenge = this.user.dailyChallenges.map((d) => d[0]);
      for (let Challenge of Object.entries(DailyChallengeData).filter(
        (DailyChallenge) => tempDailyChallenge.includes(DailyChallenge[1].ID)
      )) {
        let atemp = this.DailyTracker.filter((a) => a.name == Challenge[0]);
        if (atemp.length <= 0) {
          let internal = Challenge[1].internal;

          let aClass = Utils.importGameClass("Daily", `${internal}`);
          let temp = new aClass(Challenge[0], this);
          this.DailyTracker.push(temp);
          temp.start();
        }
      } //End For Loop
    }
  }

  addExtraRole(roleName, roleData, noReveal, noAlert, noEmit, items) {
    const modifiers = roleName.split(":")[1];
    roleName = roleName.split(":")[0];

    if (roleData) {
      roleData = JSON.parse(JSON.stringify(roleData));
    }

    for (let effect of this.passiveEffects) {
      effect.remove();
    }
    this.passiveEffects = [];

    const role = this.game.getRoleClass(roleName);

    let oldAppearanceSelf = this.role?.appearance.self;

    //this.removeRole();
    let newRole = new role(this, roleData);
    if (items == "NoStartingItems") {
      newRole.startItems = [];
    }
    newRole.isExtraRole = true;
    newRole.init(modifiers);
    if (items == "NoStartingItems") {
      for (let item of newRole.startItems) {
        for (let item2 of this.items) {
          if (item2.name == item) {
            item2.drop();
            break;
          }
        }
      }
      this.startingItems = [];
    }

    if (this.game.started && !noEmit) {
      this.game.events.emit("roleAssigned", this, newRole);
    }
    this.game.events.emit("AbilityToggle", this, newRole);
    this.ExtraRoles.push(newRole);
    return newRole;
  }

  removeRole() {
    if (this.role) this.role.remove();
  }

  sendSelf() {
    this.send("self", this.id);
  }

  sendSelfWill() {
    if (this.lastWill) this.send("lastWill", this.lastWill);
  }

  sendStateInfo() {
    this.send("state", this.game.getStateInfo());
  }

  addStateToHistory(name, state) {
    this.history.addState(name, state);
  }

  addStateEventsToHistory(events, state) {
    this.history.addStateEvents(events, state);
  }

  addStateExtraInfoToHistory(extraInfo, state) {
    this.history.addStateExtraInfo(extraInfo, state);
  }

  speak(message) {
    const originalMessage = message;
    message = new Message(message);

    if (this.role) this.role.speak(message);

    if (this.ExtraRoles) {
      for (let extraRole of this.ExtraRoles) {
        extraRole.speak(message);
      }
    }

    if (message.cancel) return;

    for (let effect of this.effects) {
      effect.speak(message);
      if (message.cancel) return;
    }

    if (!message.modified) message = originalMessage;

    // message.textColor = message.sender.user.settings.textColor !== undefined ? message.sender.user.settings.textColor : "";
    if (message.aliveOverride != true) {
      message.alive = this.alive;
    }

    return message;
  }

  speakQuote(quote) {
    const originalQuote = quote;
    quote = new Quote(quote);

    if (this.role) this.role.speakQuote(quote);

    if (this.ExtraRoles) {
      for (let extraRole of this.ExtraRoles) {
        extraRole.speakQuote(quote);
      }
    }

    if (quote.cancel) return;

    for (let effect of this.effects) {
      effect.speakQuote(quote);
      if (quote.cancel) return;
    }

    if (!quote.modified) quote = originalQuote;

    quote.alive = this.alive;

    return quote;
  }

  hear(message, master) {
    const originalMessage = message;
    message = new Message(message);
    if (this.role) this.role.hear(message);

    if (this.ExtraRoles) {
      for (let extraRole of this.ExtraRoles) {
        extraRole.hear(message);
      }
    }

    if (message.cancel) return;

    for (let item of this.items) {
      item.hear(message);
      if (message.cancel) return;
    }

    for (let effect of this.effects) {
      effect.hear(message);
      if (message.cancel) return;
      if (message.fiddled) {
        message.content =
          message.sender.name + " says something, but you cannot hear them!";
        message.modified = true;
        break;
      }
    }

    if (!message.modified) message = originalMessage;

    if (!message.meeting) this.history.addAlert(message);

    master.versions[this.id] = message;
    message = master.getMessageInfo(this);

    if (message) this.send("message", message);
  }

  hearQuote(quote, master) {
    const originalQuote = quote;
    quote = new Quote(quote);

    if (this.role) this.role.hearQuote(quote);

    if (this.ExtraRoles) {
      for (let extraRole of this.ExtraRoles) {
        extraRole.hearQuote(quote);
      }
    }

    if (quote.cancel) return;

    for (let effect of this.effects) {
      effect.hear(quote);
      if (quote.cancel) return;
    }

    if (!quote.modified) quote = originalQuote;

    master.versions[this.id] = quote;
    quote = master.getMessageInfo(this);

    if (quote) this.send("quote", quote);
  }

  seeVote(vote, noLog) {
    const originalVote = vote;
    vote = { ...vote };

    if (this.role) this.role.seeVote(vote);

    if (this.ExtraRoles) {
      for (let extraRole of this.ExtraRoles) {
        extraRole.seeVote(vote);
      }
    }

    if (vote.cancel) return;

    for (let effect of this.effects) {
      effect.seeVote(vote);
      if (vote.cancel) return;
    }

    if (!vote.modified) vote = originalVote;

    var voterId = vote.voter.id;

    if (vote.meeting.anonymous || vote.meeting.anonymousVotes)
      voterId = vote.meeting.members[voterId].anonId;

    this.send("vote", {
      voterId: voterId,
      target: vote.target,
      meetingId: vote.meeting.id,
      noLog,
    });

    return vote;
  }

  seeUnvote(info) {
    const originalInfo = info;
    info = { ...info };

    if (this.role) this.role.seeUnvote(info);

    if (this.ExtraRoles) {
      for (let extraRole of this.ExtraRoles) {
        extraRole.seeUnvote(info);
      }
    }

    if (info.cancel) return;

    for (let effect of this.effects) {
      effect.seeUnvote(info);
      if (info.cancel) return;
    }

    if (!info.modified) info = originalInfo;

    var voterId = info.voter.id;

    if (info.meeting.anonymous || info.meeting.anonymousVotes)
      voterId = info.meeting.members[voterId].anonId;

    this.send("unvote", {
      voterId: info.voter.id,
      meetingId: info.meeting.id,
      target: info.target,
    });

    return info;
  }

  seeTyping(info) {
    if (this.role) this.role.seeTyping(info);

    if (this.ExtraRoles) {
      for (let extraRole of this.ExtraRoles) {
        extraRole.seeTyping(info);
      }
    }

    if (info.cancel) return;

    for (let effect of this.effects) {
      effect.seeTyping(info);

      if (info.cancel) return;
    }

    this.send("typing", info);
  }

  sendAlert(message, extraStyle) {
    this.game.sendAlert(message, [this], extraStyle);
  }

  queueAlert(message, priority) {
    this.game.queueAlert(message, priority, [this]);
  }

  meet() {
    if (this.role) this.joinMeetings(this.role.meetings);

    if (this.ExtraRoles) {
      for (let extraRole of this.ExtraRoles) {
        this.joinMeetings(extraRole.meetings, extraRole);
      }
    }

    for (let item of this.items) this.joinMeetings(item.meetings);
  }

  joinMeetings(meetings, extraRole) {
    if (extraRole == null) {
      extraRole = this.role;
    }

    var currentStateName = this.game.getStateName();
    var [inExclusive, maxPriority] = this.getMeetingsExclusivity();

    for (let meetingName in meetings) {
      let options = meetings[meetingName];
      let disabled = false;

      for (let item of this.items)
        disabled = disabled || item.shouldDisableMeeting(meetingName, options);

      for (let effect of this.effects)
        disabled =
          disabled || effect.shouldDisableMeeting(meetingName, options);

      //TODO: Check logic to see if whileDead/whileAlive/shouldMeet
      //      can be condensed.
      if (
        disabled ||
        (options.states.indexOf(currentStateName) == -1 &&
          options.states.indexOf("*") == -1) ||
        options.disabled ||
        (options.shouldMeet != null &&
          !options.shouldMeet.bind(extraRole)(meetingName, options)) ||
        //
        (options.shouldMeetMod != null &&
          !options.shouldMeetMod.bind(extraRole)(meetingName, options)) ||
        (options.ModDisable != null &&
          !options.ModDisable.bind(extraRole)(meetingName, options)) ||
        (options.shouldMeetOneShot != null &&
          !options.shouldMeetOneShot.bind(extraRole)(meetingName, options)) ||
        (options.shouldMeetDeadMod != null &&
          !options.shouldMeetDeadMod.bind(extraRole)(meetingName, options)) ||
        //
        (this.alive && options.whileAlive == false) ||
        (!this.alive &&
          (options.whileDead == false || options.whileDead == null) &&
          (options.whileDeadMod == null || options.whileDeadMod == false)) ||
        (options.unique && options.whileDead && options.whileAlive) ||
        (this.alive && options.whileAliveMod == false) ||
        //(!this.alive && (options.whileDeadMod != null && options.whileDeadMod == false)) ||
        (options.unique && options.whileDeadMod && options.whileAliveMod) ||
        //
        (inExclusive && maxPriority > options.priority)
      ) {
        continue;
      }

      let joined = false;

      if (
        options.flags &&
        options.flags.indexOf("group") != -1 &&
        !options.unique
      ) {
        for (let meeting of this.game.meetings) {
          if (meeting.name != meetingName) continue;

          if (meeting.group && !options.noGroup) {
            if (!meeting.hasJoined(this)) {
              meeting.join(this, options);
              options.times--;

              if (options.times <= 0) delete meetings[meetingName];

              inExclusive |= meeting.exclusive;

              if (meeting.exclusive && meeting.priority > maxPriority)
                maxPriority = meeting.priority;
            }

            joined = true;
            break;
          } else if (!meeting.group && meeting.hasJoined(this)) {
            inExclusive |= meeting.exclusive;

            if (meeting.exclusive && meeting.priority > maxPriority)
              maxPriority = meeting.priority;

            joined = true;
            break;
          }
        }
      }

      if (!joined) {
        let meeting = this.game.createMeeting(options.type, meetingName);
        meeting.join(this, options);
        options.times--;

        if (options.times <= 0) delete meetings[meetingName];

        inExclusive |= meeting.exclusive;

        if (meeting.exclusive && meeting.priority > maxPriority)
          maxPriority = meeting.priority;
      }

      let attendedExclusiveMaxPriority = false;

      if (inExclusive) {
        for (let meeting of this.getMeetings()) {
          if (meeting.priority < maxPriority) {
            meeting.leave(this, true);
            continue;
          }

          if (meeting.priority == maxPriority) {
            if (attendedExclusiveMaxPriority) {
              meeting.leave(this, true);
              continue;
            }

            attendedExclusiveMaxPriority = true;
          }
        }
      }
    }
  }

  getMeetingsExclusivity() {
    for (let meeting of this.getMeetings())
      if (meeting.exclusive) return [true, meeting.priority];

    return [false, 0];
  }

  act(target, meeting, actors) {
    if (this.role) this.role.act(target, meeting, actors);

    if (this.ExtraRoles) {
      let tempNames = [this.role];
      for (let extraRole of this.ExtraRoles) {
        if (!tempNames.includes(extraRole)) {
          extraRole.act(target, meeting, actors);
          tempNames.push(extraRole);
        }
      }
    }
  }

  getImmunity(type) {
    var immunity;

    if (this.tempImmunity[type] != null) return this.tempImmunity[type];

    if (this.role) immunity = this.role.getImmunity(type);

    if (immunity == null) {
      immunity = 0;
    }

    if (this.ExtraRoles) {
      for (let extraRole of this.ExtraRoles) {
        let extraImmunity = extraRole.getImmunity(type);
        if (immunity < extraImmunity) {
          immunity = extraImmunity;
        }
      }
    }
    if (immunity == null) {
      immunity = 0;
    }
    for (let effect of this.effects) {
      let effectImmunity = effect.getImmunity(type);

      if (effectImmunity > immunity) immunity = effectImmunity;
    }

    return immunity;
  }

  getCancelImmunity(type) {
    let maxImmunity = 0;

    maxImmunity = Math.max(maxImmunity, this.role.cancelImmunity[type] || 0);

    if (this.ExtraRoles) {
      for (let extraRole of this.ExtraRoles) {
        Math.max(maxImmunity, extraRole.cancelImmunity[type] || 0);
      }
    }

    for (let effect of this.effects)
      maxImmunity = Math.max(maxImmunity, effect.cancelImmunity[type] || 0);

    return maxImmunity;
  }

  setTempImmunity(type, power, overwrite) {
    if (this.getImmunity(type) < power || overwrite)
      this.tempImmunity[type] = power;
  }

  getAppearance(type, noModifier) {
    let startnomod = noModifier;
    noModifier = noModifier || this.role.hideModifier[type];

    if (this.tempAppearance[type] != null) {
      if (this.tempAppearanceMods[type] == null) {
        noModifier = true;
      }

      return `${this.tempAppearance[type]}${
        noModifier && this.tempAppearanceMods[type] != ""
          ? ""
          : ":" + this.tempAppearanceMods[type]
      }`;
    }
    if (this.ExtraRoles) {
      for (let extraRole of this.ExtraRoles) {
        if (extraRole.appearance[type] != extraRole.name) {
          noModifier = startnomod || extraRole.hideModifier[type];
          return `${extraRole.appearance[type]}${
            noModifier ? "" : ":" + extraRole.appearanceMods[type]
          }`;
        }
      }
    }

    return `${this.role.appearance[type]}${
      noModifier ? "" : ":" + this.role.appearanceMods[type]
    }`;
  }

  setTempAppearance(type, appearance) {
    if (appearance == "real") appearance = this.role.name;
    this.tempAppearanceMods[type] = appearance.split(":")[1];
    if (
      !this.tempAppearanceMods[type] ||
      appearance.split(":")[1] == "" ||
      appearance.split(":")[1] == null
    ) {
      this.tempAppearanceMods[type] = null;
    }

    this.tempAppearance[type] = appearance.split(":")[0];
  }

  sendMeeting(meeting) {
    this.send("meeting", meeting.getMeetingInfo(this));
  }

  joinedMeeting(meeting) {
    this.history.addMeeting(meeting);
  }

  leftMeeting(meeting) {
    this.history.removeMeeting(meeting);
    this.send("leftMeeting", meeting.id);
  }

  sendMeetingMembers(meeting) {
    this.send("members", {
      meetingId: meeting.id,
      members: meeting.getMembers(),
    });
  }

  getMeetingByName(name, state) {
    return this.history.getMeetings(state).filter((m) => m.name == name)[0];
  }

  getMeetings(state) {
    return this.history.getMeetings(state);
  }

  sendMeetings(meetings) {
    meetings = meetings || this.getMeetings();

    for (let meeting of meetings) this.sendMeeting(meeting);
  }

  getHistory(targetState) {
    return this.history.getHistoryInfo(targetState);
  }

  sendHistory() {
    this.send("history", this.getHistory());
  }

  queueNonmeetActions() {
    if (this.role) {
      this.role.queueActions();
      this.role.queueNightActions();
    }

    if (this.ExtraRoles) {
      for (let extraRole of this.ExtraRoles) {
        extraRole.queueActions();
        extraRole.queueNightActions();
      }
    }

    for (let item of this.items) item.queueActions();

    for (let effect of this.effects) effect.queueActions();
  }

  holdItem(itemName, ...args) {
    const itemClass = Utils.importGameClass(this.game.type, "items", itemName);
    const item = new itemClass(...args);
    item.hold(this);
    return item;
  }

  giveEffect(effectName, ...args) {
    const effectClass = Utils.importGameClass(
      this.game.type,
      "effects",
      effectName
    );
    const effect = new effectClass(...args);
    effect.apply(this);
    return effect;
  }

  dropItem(itemName, all) {
    for (let item of this.items) {
      if (item.name == itemName) {
        item.drop();

        if (!all) break;
      }
    }
  }

  dropItemProp(itemName, prop, value, all) {
    for (let item of this.items) {
      if (item.name == itemName && String(item[prop]) == value) {
        item.drop();

        if (!all) break;
      }
    }
  }

  removeEffect(effectName, all) {
    for (let effect of this.effects) {
      if (effect.name == effectName) {
        effect.remove();

        if (!all) break;
      }
    }
  }

  removeAllEffects() {
    for (let effect of this.effects) effect.remove();
  }

  hasItem(itemName) {
    for (let item of this.items) if (item.name == itemName) return true;

    return false;
  }

  getItems(itemName) {
    return this.items.filter((i) => i.name == itemName);
  }

  getItemProp(itemName, prop, value) {
    for (let item of this.items)
      if (item.name == itemName && String(item[prop]) == value) return item;

    return;
  }

  hasEffect(effectName) {
    for (let effect of this.effects) if (effect.name == effectName) return true;

    return false;
  }

  hasItemProp(itemName, prop, value) {
    for (let item of this.items)
      if (item.name == itemName && String(item[prop]) == value) return true;

    return false;
  }

  hasEffectProp(effectName, prop, value) {
    for (let effect of this.effects)
      if (effect.name == effectName && String(effect[prop]) == value)
        return true;

    return false;
  }

  kill(killType, killer, instant) {
    if (!this.alive) return;

    this.game.resetLastDeath = true;
    this.game.queueDeath(this);

    if (killType != "silent") this.queueDeathMessage(killType, instant);

    let roleReveal = true;

    if (this.game.isNoReveal()) {
      roleReveal = false;
    }

    if (this.game.isAlignmentOnlyReveal()) {
      roleReveal = false;
      this.role.revealAlignmentToAll(false, this.getRevealType(killType), true);
    }

    if (roleReveal) {
      this.role.revealToAll(false, this.getRevealType(killType), true);
    }

    this.queueLastWill();
    this.game.events.emit("death", this, killer, killType, instant);
    this.game.events.emit("AbilityToggle", this);

    if (this.game.isCleansingDeaths() && this.game.type == "Mafia") {
      this.game.CleansePlayer(this);
    }

    if (!instant) return;

    for (let meeting of this.getMeetings()) {
      let vegKickMeetingId = this.getVegKickMeeting()?.id;
      if (meeting.id === vegKickMeetingId) {
        continue;
      }
      meeting.leave(this, true);
    }

    this.meet();

    for (let meeting of this.game.meetings) meeting.generateTargets();

    if (this.game.vegKickMeeting !== undefined) {
      this.game.vegKickMeeting.resetKicks();
    }

    this.game.sendMeetings();
    this.game.checkAllMeetingsReady();
  }

  revive(revivalType, reviver, instant) {
    if (this.alive) return;
    if (this.exorcised) return;

    this.game.queueRevival(this);
    this.queueRevivalMessage(revivalType, instant);
    this.game.events.emit("revival", this, reviver, revivalType);
    this.game.events.emit("AbilityToggle", this);

    if (!instant) return;

    for (let meeting of this.getMeetings()) meeting.leave(this, true);

    this.meet();

    for (let meeting of this.game.meetings) meeting.generateTargets();

    this.game.sendMeetings();
    this.game.checkAllMeetingsReady();
  }

  getRevealType(deathType) {
    return "reveal";
  }

  queueDeathMessage(type) {
    let deathTypeCanUseCustomDeathMessage = type != "leave" && type != "veg";
    let customDeathMessage = this.user?.settings?.deathMessage;
    const deathMessage =
      customDeathMessage &&
      deathTypeCanUseCustomDeathMessage &&
      !this.game.anonymousGame
        ? customDeathMessage.replace("${name}", this.name)
        : this.deathMessages(type || "basic", this.name);

    if (this.game.useObituaries) {
      this.game.addToObituary(this.id, "deathMessage", deathMessage);
    } else {
      this.game.queueAlert(deathMessage);
    }
  }

  queueRevivalMessage(type) {
    const revivalMessage = this.revivalMessages(type || "basic", this.name);
    this.game.queueAlert(revivalMessage);
  }

  queueLastWill() {
    if (!this.game.isLastWills()) return;

    var will;

    if (this.lastWill)
      will = `:will: As read from ${this.name}'s last will: ${this.lastWill}`;
    else will = `:will: ${this.name} did not leave a will.`;

    if (this.game.useObituaries) {
      this.game.addToObituary(this.id, "lastWill", will);
    } else {
      this.game.queueAlert(will);
    }
  }

  recordStat(stat, inc) {
    if (!this.game.ranked && !this.game.competitive) return;

    if (!this.user.stats[this.game.type])
      this.user.stats[this.game.type] = dbStats.statsSet(this.game.type);

    const stats = this.user.stats[this.game.type];

    if (!stats.all) stats.all = dbStats.statsObj(this.game.type);

    this.updateStatsObj(stats.all, stat, inc);
    this.updateStatsMap(stats, "bySetup", this.game.setup.id, stat, inc);

    if (!this.role) return;

    var role = `${this.role.name}${
      this.role.modifier ? ":" + this.role.modifier : ""
    }`;
    this.updateStatsMap(stats, "byRole", role, stat, inc);
    this.updateStatsMap(stats, "byAlignment", this.role.alignment, stat, inc);
  }

  updateStatsMap(stats, mapName, key, stat, inc) {
    if (!stats[mapName]) stats[mapName] = {};

    const statsObj = stats[mapName][key] || dbStats.statsObj(this.game.type);
    this.updateStatsObj(statsObj, stat, inc);
    stats[mapName][key] = statsObj;
  }

  updateStatsObj(stats, stat, inc) {
    if (stat != "totalGames") {
      stats[stat].total++;

      if (inc) stats[stat].count++;
    } else stats.totalGames++;
  }

  swapIdentity(player) {
    //Swap Factions
    let tempFaction = this.faction;
    this.faction = player.faction;
    player.faction = tempFaction;

    // Swap sockets
    this.socket.clearListeners();
    player.socket.clearListeners();

    var tempSocket = this.user.socket;

    this.user.socket = player.user.socket;
    this.socket = player.user.socket;
    player.user.socket = tempSocket;
    player.socket = tempSocket;

    player.user.swapped = this.user;

    this.socketListeners();
    player.socketListeners();

    this.sendSelf();
    this.sendSelfWill();
    player.sendSelf();
    player.sendSelfWill();

    // Swap stats
    var tempStats = this.user.stats;
    this.user.stats = player.stats;
    player.stats = tempStats;

    // Swap alive/dead
    var tempAlive = this.alive;

    if (player.alive && !this.alive) this.game.queueRevival(this);
    else if (!player.alive && this.alive) this.game.queueDeath(this);

    if (tempAlive && !player.alive) this.game.queueRevival(player);
    else if (!tempAlive && player.alive) this.game.queueDeath(player);

    // Swap roles
    var tempRole = this.role;

    this.role = player.role;
    this.role.player = this;
    this.role.revealToSelf(true);

    player.role = tempRole;
    player.role.player = player;
    player.role.revealToSelf(true);

    //Swap Extra Roles
    var tempExtraRoles = this.ExtraRoles;
    this.ExtraRoles = player.ExtraRoles;
    player.ExtraRoles = tempExtraRoles;

    for (let extraRole of this.ExtraRoles) {
      extraRole.player = this;
    }
    for (let extraRole of player.ExtraRoles) {
      extraRole.player = player;
    }
    /*
    let temp = this.user.customEmotes;
    this.user.customEmotes = player.user.customEmotes;
    player.user.customEmotes = temp;
    */

    // Swap items and effects
    var tempItems = this.items;
    this.items = player.items;
    player.items = tempItems;

    for (let item of this.items) item.holder = this;

    for (let item of player.items) item.holder = player;

    var tempEffects = this.effects;
    this.effects = player.effects;
    player.effects = tempEffects;

    for (let effect of this.effects) effect.player = this;

    for (let effect of player.effects) effect.player = player;

    for (let alert of player.game.alertQueue.items) {
      if (!alert.recipients) {
        continue;
      }
      for (let i = 0; i < alert.recipients.length; i++) {
        let recipient = alert.recipients[i];
        if (recipient.id === player.id) {
          alert.recipients[i] = this;
        } else if (recipient.id === this.id) {
          alert.recipients[i] = player;
        }
      }
    }

    // Reveal disguiser to disguised player
    player.role.revealToPlayer(this, true);
  }

  getVotePower(meeting) {
    return 1;
  }
};
