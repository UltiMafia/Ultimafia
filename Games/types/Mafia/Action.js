const Action = require("../../core/Action");
const Random = require("../../../lib/Random");
const Player = require("../../core/Player");

module.exports = class MafiaAction extends Action {
  constructor(options) {
    super(options);
  }

  heal(power, target) {
    power = power || 1;
    target = target || this.target;

    target.setTempImmunity("kill", power);
    target.setTempImmunity("poison", power);
    target.removeEffect("Poison", true);
    target.removeEffect("Bleeding", true);
  }

  preventConvert(power, target) {
    power = power || 1;
    target = target || this.target;

    target.setTempImmunity("convert", power);
  }

  blockActions(target) {
    target = target || this.target;

    for (let action of this.game.actions[0]) {
      if (action.priority > this.priority && !action.hasLabel("absolute")) {
        action.cancelActor(target);
      }
    }
  }

  makeUntargetable(player, excludeLabel) {
    player = player || this.target;

    for (let action of this.game.actions[0]) {
      if (action.hasLabel("absolute") || action.hasLabel(excludeLabel)) {
        continue;
      }

      let toCheck = action.target;
      if (!Array.isArray(action.target)) {
        toCheck = [action.target];
      }

      for (let target of toCheck) {
        if (target === player) {
          action.cancel(true);
        }
      }
    }
  }

  getVisits(player) {
    player = player || this.target;

    var visits = [];
    for (let action of this.game.actions[0]) {
      if (
        action.actors.indexOf(player) != -1 &&
        !action.hasLabel("hidden") &&
        action.target &&
        action.target instanceof Player
      ) {
        let targets = action.target;
        if (!Array.isArray(action.target)) {
          targets = [action.target];
        }

        visits.push(...targets);
      }
    }

    return Random.randomizeArray(visits);
  }

  getVisitors(player, label) {
    player = player || this.actor;

    var visitors = [];
    for (let action of this.game.actions[0]) {
      if (label && !action.hasLabel(label)) {
        continue;
      }

      let toCheck = action.target;
      if (!Array.isArray(action.target)) {
        toCheck = [action.target];
      }

      for (let target of toCheck) {
        if (target === player && !action.hasLabel("hidden")) {
          visitors.push(...action.actors);
        }
      }
    }

    return Random.randomizeArray(visitors);
  }

  // hasVisitors returns true if the player was visited
  hasVisitors(player, label) {
    player = player || this.actor;

    for (let action of this.game.actions[0]) {
      if (label && !action.hasLabel(label)) {
        continue;
      }

      let toCheck = action.target;
      if (!Array.isArray(action.target)) {
        toCheck = [action.target];
      }

      for (let target of toCheck) {
        if (target === player && !action.hasLabel("hidden")) {
          return true;
        }
      }
    }
    return false;
  }

  // hasVisits returns true if the player visited
  hasVisits(player) {
    player = player || this.target;

    for (let action of this.game.actions[0]) {
      if (
        action.actors.indexOf(player) != -1 &&
        !action.hasLabel("hidden") &&
        action.target &&
        action.target != "No"
      ) {
        let targets = action.target;
        if (!Array.isArray(action.target)) {
          targets = [action.target];
        }
        return true;
      }
    }
    return false;
  }

  // for the actions of actor to be on target
  redirectAllActions(actor, target, label) {
    actor = actor || this.actor;
    target = target || this.target;

    for (let action of this.game.actions[0]) {
      if (label && !action.hasLabel(label)) {
        continue;
      }

      if (
        action.priority > this.priority &&
        !action.hasLabel("uncontrollable") &&
        action.actor == actor
      ) {
        action.setAllTargets(target);
      }
    }
  }

  // for every action targeting originalTarget, make the action target newTarget
  redirectAllActionsOnTarget(originalTarget, newTarget, label) {
    originalTarget = originalTarget || this.target;
    newTarget = newTarget || this.actor;

    for (let action of this.game.actions[0]) {
      if (label && !action.hasLabel(label)) {
        continue;
      }

      if (action.target == originalTarget) {
        action.target = newTarget;
        continue;
      }

      var newTargets = [];
      if (Array.isArray(action.target)) {
        for (const t of action.target) {
          if (t == originalTarget) {
            newTargets.push(newTarget);
          } else {
            newTargets.push(t);
          }
        }

        action.target = newTargets;
      }
    }
  }

  setAllTargets(player) {
    player = player || this.actor;

    if (!Array.isArray(this.target)) {
      if (this.target instanceof Player) {
        this.target = player;
      }
      return;
    }

    let numMultiTargets = this.target.length;
    this.target = Array(numMultiTargets).fill(player);
  }

  getReports(player) {
    player = player || this.target;
    return this.getReportsFromAlerts(this.game.alertQueue, player);
  }

  getAllReports(player) {
    player = player || this.target;
    let allReports = [];

    for (let i in this.game.history.states) {
      let alerts = this.game.history.states[i].alerts;
      let reports = this.getReportsFromAlerts(alerts, player);
      allReports.push(...reports);
    }

    return allReports;
  }

  getReportsFromAlerts(alerts, player) {
    player = player || this.target;
    let reports = [];

    for (let alert of alerts) {
      if (alert.globalAlert) {
        continue;
      }

      if (!alert.recipients) {
        continue;
      }

      if (alert.message?.startsWith("Graveyard participation")) {
        continue;
      }
      if (alert.content?.startsWith("Graveyard participation")) {
        continue;
      }
      if (alert.content?.startsWith("You will be kicked")) {
        continue;
      }
      if (
        alert.content?.includes("role is") &&
        !alert.content?.startsWith(":")
      ) {
        continue;
      }

      for (let recipient of alert.recipients) {
        if (recipient === player) {
          reports.push(alert.message || alert.content);
        }
      }
    }

    return reports;
  }

  queueGetEffectAlert(effectName, target, extra) {
    target = target || this.target;

    let alert = "";
    switch (effectName) {
      case "InLoveWith":
        alert = `:sy3g: You fall deathly in love with ${extra}.`;
        break;
      default:
        alert = `You have received an effect: ${effectName}!`;
    }

    target.queueAlert(alert);
  }

  stealItem(item, toGive) {
    toGive = toGive || this.actor;

    if (item.cannotBeStolen) {
      return false;
    }

    item.drop();
    item.hold(toGive);
    toGive.queueGetItemAlert(item.snoopName);
    return true;
  }
  stealItemByName(itemName, victim, toGive) {
    victim = victim || this.target;
    toGive = toGive || this.actor;

    const item = victim.items.find((e) => e.name === itemName);
    if (item) {
      return this.stealItem(item, toGive);
    }
  }

  stealRandomItem(victim, toGive) {
    victim = victim || this.target;
    toGive = toGive || this.actor;

    let items = Random.randomizeArray(victim.items);
    for (let item of items) {
      if (this.stealItem(item, toGive)) {
        return item;
      }
    }
    return null;
  }

  stealAllItems(victim, toGive) {
    victim = victim || this.target;
    toGive = toGive || this.actor;

    let numItems = victim.items.length;
    let toSteal = 0;
    for (let i = 0; i < numItems; i++) {
      let stolen = this.stealItem(victim.items[toSteal], toGive);
      if (!stolen) {
        toSteal += 1;
      }
    }
  }

  snoopAllItems(victim, excludeRoleItems) {
    victim = victim || this.target;

    let items = [];
    for (let item of this.target.items) {
      if (item.cannotBeSnooped) {
        continue;
      }

      items.push("a " + item.snoopName);
    }

    if (excludeRoleItems) {
      return items;
    }

    switch (victim.role.name) {
      case "Freemason":
      case "Cultist":
        items.push("a Robe");
        break;
      case "Janitor":
        items.push("a Mop");
        break;
      case "Surgeon":
      case "Chef":
      case "Serial Killer":
        items.push("a Knife");
        break;
    }

    return items;
  }

  getAliveNeighbors() {
    let alive = this.game.alivePlayers();
    let index = alive.indexOf(this.actor);

    const leftIdx = (index - 1 + alive.length) % alive.length;
    const rightIdx = (index + 1) % alive.length;
    return [alive[leftIdx], alive[rightIdx]];
  }
};
