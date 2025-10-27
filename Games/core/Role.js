const Utils = require("./Utils");
const Action = require("./Action");
const constants = require("../../data/constants");
const modifierData = require("../..//data/modifiers");

module.exports = class Role {
  constructor(name, player, data) {
    /* Base properties */
    this.name = name;
    this.player = player;
    this.game = player.game;
    this.events = this.game.events;
    this.data = data || {};
    this.cards = [];
    this.alignment = "";
    this.passiveEffects = [];
    this.isExtraRole;

    /* Card overwritable properties */
    this.winCount = null;
    this.winCheck = {
      priority: 0,
      check: (counts, winners) => {
        // winners.addPlayer(this.player, null or "group")
        // Return true to stop checking for other winners
      },
    };
    this.winCheckSpecial = {
      priority: 0,
      check: (counts, winners) => {
        // winners.addPlayer(this.player, null or "group")
        // Return true to stop checking for other winners
      },
    };
    this.appearance = {
      self: "real",
      reveal: "real",
    };
    this.appearanceMods = {
      self: "real",
      reveal: "real",
    };
    this.hideModifier = {};
    this.oblivious = {};
    this.actions = [];
    this.passiveActions = [];
    this.startItems = [];
    this.startEffects = [];
    this.immunity = {};
    this.cancelImmunity = {};
    this.meetings = {};
    this.methods = {};
    this.listeners = {};
    this.copyableListeners = {};
    this.copiedListeners = [];
    this.stateMods = {
      /*
            name: {
                type: "add" or "remove" or "length" or "delayActions",
                index: number,
                length: number,
                delayActions: boolean,
                shouldSkip: function
            }    
        */
    };
    this.meetingMods = {};
    this.priorityOffset = 0;
    this.Action = Action;
  }

  init(modifiers) {
    this.modifier = modifiers || "";

    if (modifiers) {
      const modifiersArray = modifiers.split("/");
      modifiersArray.sort((a, b) => {
        const modA = modifierData[this.game.type][a];
        const modB = modifierData[this.game.type][b];
        return (modA.priority ?? 0) - (modB.priority ?? 0);
      });

      for (const modifier of modifiersArray) {
        this.cards = this.cards.concat(
          constants.modifiers[this.game.type][modifier]
        );
      }
    }

    // Initialize role cards
    for (let i in this.cards) {
      var card = Utils.importGameClass(
        this.game.type,
        "roles/cards",
        this.cards[i]
      );
      card = new card(this);
      card.init();
      this.cards.splice(i, 1, card);
    }
    // Set default times of meetings
    for (let meetingName in this.meetings) {
      if (this.meetings[meetingName].times == null)
        this.meetings[meetingName].times = Infinity;
    }

    // Set modifications of meetings
    for (let meetingName in this.meetingMods) {
      var meetings = [];
      var meetingNames = [];

      if (
        meetingName != "*" &&
        !meetingName.includes("*") &&
        this.meetings[meetingName]
      ) {
        meetings = [this.meetings[meetingName]];
        meetingNames = [meetingName];
      } else if (meetingName == "*" || meetingName.includes("*")) {
        meetings = Object.values(this.meetings);
        meetingNames = Object.keys(this.meetingMods);
      }

      for (let i in meetings) {
        let meeting = meetings[i];

        for (let key in this.meetingMods[meetingName]) {
          //this.game.queueAlert(`Meeting Player: ${this.player.name} Meeting: ${meetingName} Key: ${key}`);

          if (key != "shouldMeet" || meeting.shouldMeet == null) {
            meeting[key] = this.meetingMods[meetingName][key];
          } else {
            let existingShouldMeet = meeting.shouldMeet.bind(this);
            let cardShouldMeet =
              this.meetingMods[meetingName].shouldMeet.bind(this);

            meeting.shouldMeet = function () {
              return (
                existingShouldMeet(meetingNames[i]) &&
                cardShouldMeet(meetingNames[i])
              );
            };
          }
        }
      }
    }

    // Set listeners
    for (let eventName in this.listeners) {
      for (let i in this.listeners[eventName]) {
        let listener = this.listeners[eventName][i].bind(this);
        this.listeners[eventName][i] = listener;
        this.events.on(eventName, listener);
      }
    }

    // Hold starting items
    for (let item of this.startItems) {
      let StartingItem;
      if (typeof item == "string") {
        StartingItem = this.player.holdItem(item);
      } else {
        StartingItem = this.player.holdItem(item.type, ...item.args);
      }
      this.player.startingItems.push(StartingItem);
    }

    // Give intial effects
    for (let effect of this.startEffects) {
      if (typeof effect == "string") this.player.giveEffect(effect);
      else this.player.giveEffect(effect.type, ...effect.args);
    }

    //Initialize appearances
    for (let key in this.appearance) {
      if (this.appearance[key] == "real") this.appearance[key] = this.name;
    }
    for (let key in this.appearanceMods) {
      if (this.appearanceMods[key] == "real")
        this.appearanceMods[key] = this.modifier;
    }

    // Bind role to winCheck
    this.winCheck.check = this.winCheck.check.bind(this);
    this.winCheckSpecial.check = this.winCheckSpecial.check.bind(this);

    // Modify games states
    for (let name in this.stateMods) {
      let mod = this.stateMods[name];

      switch (mod.type) {
        case "add":
          if (mod.shouldSkip) mod.shouldSkip = mod.shouldSkip.bind(this);

          this.game.addStateType(
            name,
            mod.index,
            mod.length,
            mod.delayActions,
            mod.shouldSkip
          );
          break;
        case "remove":
          this.game.removeStateType(name);
          break;
        case "length":
          this.game.setStateLength(name, mod.length);
          break;
        case "delayActions":
          this.game.setStateDelayActions(name, mod.delayActions);
          break;
        case "shouldSkip":
          if (mod.shouldSkip) mod.shouldSkip = mod.shouldSkip.bind(this);

          this.game.setStateShouldSkip(name, mod.shouldSkip);
          break;
      }
    }

    // Bind role methods
    for (const method in this.methods) {
      this.methods[method] = this.methods[method].bind(this);
    }

    // Configure temporary appearance reset
    this.game.events.on("afterActions", () => {
      this.tempAppearance = {};
      this.tempAppearanceMods = {};
    });
  }

  enableListener(eventName, listener) {
    this.events.removeListener(eventName, listener);
    this.events.on(eventName, listener);
  }

  disableListener(eventName, listener) {
    this.events.removeListener(eventName, listener);
  }

  enableListeners() {
    for (let eventName in this.listeners)
      for (let listener of this.listeners[eventName])
        this.enableListener(eventName, listener);
  }

  disableListeners() {
    for (let eventName in this.listeners)
      for (let listener of this.listeners[eventName])
        this.disableListener(eventName, listener);
  }

  removeListeners() {
    for (let eventName in this.listeners)
      for (let listener of this.listeners[eventName])
        this.events.removeListener(eventName, listener);

    this.listeners = [];
  }

  copyListeners(player) {
    for (let eventName in player.role.copyableListeners) {
      let card = player.role.copyableListeners[eventName];

      if (card) {
        let listener = card.listeners[eventName];

        if (this.copiedListeners.indexOf(listener) == -1) {
          this.copiedListeners.push(listener);

          if (!this.listeners[eventName]) this.listeners[eventName] = [];

          listener = listener.bind(this);
          this.listeners[eventName].push(listener);
          this.enableListener(eventName, listener);
        }
      }
    }
  }

  getRevealText(roleName, modifiers, rvealType) {
    if (modifiers == null || modifiers == "" || modifiers == undefined) {
      return `${roleName}`;
    }
    return `${roleName}${modifiers ? ` (${modifiers})` : ""}`;
  }

  revealAlignmentToAll(noAlert, revealType, dueToDeath = false) {
    revealType = revealType || "reveal";

    if (!this.appearance[revealType] && !this.player.tempAppearance[revealType])
      return;

    var appearance = this.player.getAppearance(revealType);

    //this.game.queueReveal(this.player, appearance);
    this.game.queueReveal(this.player, this.game.getRoleAlignment(appearance));
    if (!noAlert) {
      const revealMessage = `${
        this.player.name
      }'s alignment is ${this.game.getRoleAlignment(appearance)}.`;
      if (this.game.useObituaries) {
        this.game.addToObituary(this.player.id, "revealMessage", revealMessage);
      } else {
        this.game.queueAlert(revealMessage);
      }
    }
  }

  revealToAll(noAlert, revealType, dueToDeath = false) {
    revealType = revealType || "reveal";

    if (!this.appearance[revealType] && !this.player.tempAppearance[revealType])
      return;

    var appearance = this.player.getAppearance(revealType);
    var roleName = appearance.split(":")[0];
    var modifiers = appearance.split(":")[1];
    this.game.queueReveal(this.player, appearance);

    if (!noAlert) {
      const revealMessage = `${this.player.name}'s role is ${this.getRevealText(
        roleName,
        modifiers,
        revealType
      )}.`;
      if (dueToDeath && this.game.useObituaries) {
        this.game.addToObituary(this.player.id, "revealMessage", revealMessage);
      } else {
        this.game.queueAlert(revealMessage);
      }
    }
  }

  revealToSelf(noAlert) {
    if (!this.appearance.self && !this.player.tempAppearance.self) return;

    var appearance = this.player.getAppearance("self");
    var roleName = appearance.split(":")[0];
    var modifiers = appearance.split(":")[1];

    this.player.history.recordRole(this.player, appearance);

    // Get full role data for the modal
    const roleData = require("../../data/roles");
    const roleFromData = roleData[this.game.type][roleName];

    if (roleFromData) {
      // Prepare role data for the frontend modal
      const roleInfo = {
        roleName: roleName,
        modifiers: modifiers ? modifiers.split("/") : [],
        alignment: roleFromData.alignment,
        description: Array.isArray(roleFromData.description)
          ? roleFromData.description.join(" ")
          : roleFromData.description || "",
        specialInteractions: roleFromData.SpecialInteractions
          ? Object.values(roleFromData.SpecialInteractions).flat()
          : [],
        tags: roleFromData.tags || [],
        category: roleFromData.category || "",
      };

      this.player.send("roleReveal", {
        playerId: this.player.id,
        role: appearance,
        roleData: roleInfo,
      });
    } else {
      // Fallback to original behavior if role data not found
      this.player.send("reveal", {
        playerId: this.player.id,
        role: appearance,
      });
    }

    if (!noAlert) return;
  }

  revealToPlayer(player, noAlert, revealType) {
    revealType = revealType || "reveal";

    if (!this.appearance[revealType] && !this.player.tempAppearance[revealType])
      return;

    var appearance = this.player.getAppearance(revealType) || this.name;
    var roleName = appearance.split(":")[0];
    var modifiers = appearance.split(":")[1];

    player.history.recordRole(this.player, appearance);
    player.send("reveal", { playerId: this.player.id, role: appearance });

    if (!noAlert)
      player.queueAlert(
        `:system: ${this.player.name}'s role is ${this.getRevealText(
          roleName,
          modifiers
        )}.`
      );
  }

  queueActions() {
    for (let options of this.actions) {
      options.actor = this.player;
      options.game = this.game;
      this.game.queueAction(new this.Action(options));
    }
  }

  queueNightActions() {
    for (let options of this.passiveActions) {
      //this.game.queueAlert(options.state + " " + this.game.getStateInfo().name)
      if (this.game.getStateInfo().name.match(options.state)) {
        if(options.ability && !this.hasAbility(options.ability)){
          return;
        }
        this.game.queueAction(new this.Action(options));
      }
    }
  }

  getImmunity(type) {
    var immunity = this.immunity[type];
    if (immunity == null) immunity = 0;
    return immunity;
  }

  remove() {
    if (this.isExtraRole != true) {
      this.player.role = null;
    }
    for (let effect of this.passiveEffects) {
      effect.remove();
    }
    this.passiveEffects = [];
    this.game.events.emit(
      "RoleBeingRemoved",
      this,
      this.player,
      this.isExtraRole
    );
    this.removeListeners();
  }

  act(target, meeting, actors) {
    var options = this.meetings[meeting.name];

    if (!options) {
      for (let item of this.player.items) {
        options = item.meetings[meeting.name];

        if (options) break;
      }
    }

    if (!options || !options.action) return;

    options = options.action;
    options.actors = actors || [this.player];
    options.target = target;
    options.game = this.game;
    options.meeting = meeting;

    var action = new this.Action(options);

    if (meeting.instant || meeting.repeatable)
      this.game.instantAction(action, meeting);
    else this.game.queueAction(action);
  }

  speak(message) {
    for (let card of this.cards) {
      card.speak(message);
      if (message.cancel) return;
    }
  }

  speakQuote(quote) {
    for (let card of this.cards) {
      card.speakQuote(quote);
      if (quote.cancel) return;
    }
  }

  hear(message) {
    for (let card of this.cards) {
      card.hear(message);
      if (message.cancel) return;
    }
  }

  hearQuote(quote) {
    for (let card of this.cards) {
      card.hearQuote(quote);
      if (quote.cancel) return;
    }
  }

  seeVote(vote) {
    for (let card of this.cards) {
      card.seeVote(vote);
      if (vote.cancel) return;
    }
  }

  seeUnvote(info) {
    for (let card of this.cards) {
      card.seeUnvote(info);
      if (info.cancel) return;
    }
  }

  seeTyping(info) {
    for (let card of this.cards) {
      card.seeTyping(info);
      if (info.cancel) return;
    }
  }
};
