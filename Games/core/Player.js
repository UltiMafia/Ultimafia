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
    this.alive = true;
    this.data = {};
    this.items = [];
    this.effects = [];
    this.tempImmunity = {};
    this.tempAppearance = {};
    this.history = new History(this.game, this);
    this.ready = false;
    this.won = false;
    this.deathMessages = deathMessages;
    this.revivalMessages = revivalMessages;
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
    };

    this.id = shortid.generate();
    this.anonId = deckProfile.id;
    this.name = deckProfile.name;
    this.user.avatar = deckProfile.avatar;
    this.user.textColor = deckProfile.color;
    this.user.settings.deathMessage = deckProfile.deathMessage;
    delete this.user.id;
    delete this.user.nameColor;
  }

  makeNotAnonymous() {
    let p = this.originalProfile;

    this.game.sendAlert(`${p.name}'s anonymous name was ${this.name}.`);

    this.user.id = p.userId;
    this.name = p.name;
    this.user.avatar = p.hasAvatar;
    this.user.textColor = p.textColor;
    this.user.nameColor = p.nameColor;
    delete this.anonId;
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
      }
    });

    socket.on("quote", (quote) => {
      try {
        if (typeof quote != "object") return;

        quote.messageId = String(quote.messageId);
        quote.toMeetingId = String(quote.toMeetingId);
        quote.fromMeetingId = String(quote.fromMeetingId);
        quote.fromState = String(quote.fromState);

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

        meeting.vote(this, vote.selection);
      } catch (e) {
        logger.error(e);
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
      } catch (e) {
        logger.error(e);
      }
    });

    socket.on("lastWill", (will) => {
      try {
        if (!this.game.setup.lastWill) return;

        if (this.game.type == "Mafia" && this.game.getStateName() == "Day")
          return;

        will = String(will).slice(0, constants.maxWillLength);
        will = this.processWill(will);
        this.lastWill = will;
      } catch (e) {
        logger.error(e);
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

        if (this.game.ranked) {
          this.sendAlert("You cannot kick players from ranked games.");
          return;
        }

        const kickPermanently = cmd.name == "ban";
        const andBanned = kickPermanently ? "and banned " : "";

        for (let player of this.game.players) {
          if (player.name.toLowerCase() === cmd.args[0].toLowerCase()) {
            this.game.kickPlayer(player, kickPermanently);
            this.game.sendAlert(
              `${player.name} was kicked ${andBanned}from the game.`
            );
            return;
          }
        }
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
      birthday: this.user.birthday,
    };

    return info;
  }

  setRole(roleName, roleData, noReveal, noAlert, noEmit) {
    const modifiers = roleName.split(":")[1];
    roleName = roleName.split(":")[0];

    const role = this.game.getRoleClass(roleName);

    let oldAppearanceSelf = this.role?.appearance.self;
    this.removeRole();
    this.role = new role(this, roleData);
    this.role.init(modifiers);

    if (
      !(
        noReveal ||
        (oldAppearanceSelf && oldAppearanceSelf === this.role.appearance.self)
      )
    )
      this.role.revealToSelf(noAlert);

    if (this.game.started && !noEmit) {
      this.game.events.emit("roleAssigned", this);
    }
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

    if (message.cancel) return;

    for (let effect of this.effects) {
      effect.speak(message);
      if (message.cancel) return;
    }

    if (!message.modified) message = originalMessage;

    // message.textColor = message.sender.user.settings.textColor !== undefined ? message.sender.user.settings.textColor : "";
    message.alive = this.alive;

    return message;
  }

  speakQuote(quote) {
    const originalQuote = quote;
    quote = new Quote(quote);

    if (this.role) this.role.speakQuote(quote);

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

    if (message.cancel) return;

    for (let effect of this.effects) {
      effect.hear(message);
      if (message.cancel) return;
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

    if (info.cancel) return;

    for (let effect of this.effects) {
      effect.seeTyping(info);

      if (info.cancel) return;
    }

    this.send("typing", info);
  }

  sendAlert(message) {
    this.game.sendAlert(message, [this]);
  }

  queueAlert(message, priority) {
    this.game.queueAlert(message, priority, [this]);
  }

  meet() {
    if (this.role) this.joinMeetings(this.role.meetings);

    for (let item of this.items) this.joinMeetings(item.meetings);
  }

  joinMeetings(meetings) {
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

      if (
        disabled ||
        (options.states.indexOf(currentStateName) == -1 &&
          options.states.indexOf("*") == -1) ||
        options.disabled ||
        (options.shouldMeet != null &&
          !options.shouldMeet.bind(this.role)(meetingName, options)) ||
        (this.alive && options.whileAlive == false) ||
        (!this.alive && !options.whileDead) ||
        (options.unique && options.whileDead && options.whileAlive) ||
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
  }

  getImmunity(type) {
    var immunity;

    if (this.tempImmunity[type] != null) return this.tempImmunity[type];

    if (this.role) immunity = this.role.getImmunity(type);
    else immunity = 0;

    for (let effect of this.effects) {
      let effectImmunity = effect.getImmunity(type);

      if (effectImmunity > immunity) immunity = effectImmunity;
    }

    return immunity;
  }

  getCancelImmunity(type) {
    let maxImmunity = 0;

    maxImmunity = Math.max(maxImmunity, this.role.cancelImmunity[type] || 0);

    for (let effect of this.effects)
      maxImmunity = Math.max(maxImmunity, effect.cancelImmunity[type] || 0);

    return maxImmunity;
  }

  setTempImmunity(type, power, overwrite) {
    if (this.getImmunity(type) < power || overwrite)
      this.tempImmunity[type] = power;
  }

  getAppearance(type, noModifier) {
    noModifier = noModifier || this.role.hideModifier[type];

    if (this.tempAppearance[type] != null)
      return `${this.tempAppearance[type]}${
        noModifier ? "" : ":" + this.role.modifier
      }`;

    return `${this.role.appearance[type]}${
      noModifier ? "" : ":" + this.role.modifier
    }`;
  }

  setTempAppearance(type, appearance) {
    if (appearance == "real") appearance = this.role.name;

    this.tempAppearance[type] = appearance;
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
    if (this.role) this.role.queueActions();

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

    if (!this.game.setup.noReveal)
      this.role.revealToAll(false, this.getRevealType(killType));

    this.queueLastWill();
    this.game.events.emit("death", this, killer, killType, instant);

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

    this.game.queueRevival(this);
    this.queueRevivalMessage(revivalType, instant);
    this.game.events.emit("revival", this, reviver, revivalType);

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
    this.game.queueAlert(deathMessage);
  }

  queueRevivalMessage(type) {
    const revivalMessage = this.revivalMessages(type || "basic", this.name);
    this.game.queueAlert(revivalMessage);
  }

  queueLastWill() {
    if (!this.game.setup.lastWill) return;

    var will;

    if (this.lastWill)
      will = `:will: As read from ${this.name}'s last will: ${this.lastWill}`;
    else will = `:will: ${this.name} did not leave a will.`;

    this.game.queueAlert(will);
  }

  recordStat(stat, inc) {
    if (!this.game.ranked) return;

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

    // Reveal disguiser to disguised player
    player.role.revealToPlayer(this, true);
  }
};
