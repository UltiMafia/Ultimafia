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
    target.removeEffect("Poison", true);
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
        action.target != "No"
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
          visitors.push(action.actor);
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

  redirectAllActions(actor, target) {
    actor = actor || this.actor;
    target = target || this.target;

    for (let action of this.game.actions[0]) {
      if (
        action.priority > this.priority &&
        !action.hasLabel("uncontrollable") &&
        action.actor == actor
      ) {
        action.setAllTargets(target);
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
      if (alert.content?.startsWith("Your role is")) {
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
      case "Silenced":
        alert = "You have been silenced! You are unable to speak.";
        break;
      case "InLoveWith":
        alert = `:sy3g: You fall deathly in love with ${extra}.`;
        break;
      default:
        alert = `You have received an effect: ${effectName}!`;
    }

    target.queueAlert(alert);
  }

  queueGetItemAlert(itemName, target) {
    target = target || this.target;

    let alert = "";
    switch (itemName) {
      case "Gun":
        alert = ":sy2h: You have received a gun!";
        break;
      case "Armor":
        alert = ":sy1a: You have received armor!";
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
      case "TickingBomb":
        alert =
          "You have received a Bomb (Ticking). It will explode randomly in the next 10 to 30 seconds.";
        break;
      case "Cat":
        alert = ":sy9b: You have received a cat!";
        break;
      default:
        alert = `You have received a ${itemName}!`;
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
    this.queueGetItemAlert(item.name, toGive);
    return true;
  }

  stealRandomItem(victim, toGive) {
    victim = victim || this.target;
    toGive = toGive || this.actor;

    let items = Random.randomizeArray(victim.items);
    for (let item of items) {
      if (this.stealItem(item, toGive)) {
        return;
      }
    }
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
      case "Mason":
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
};
