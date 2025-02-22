const models = require("../../db/models");

module.exports = class Action {
  constructor(options) {
    this.actors = options.actors ?? [];
    if (this.actors.length === 0 && options.actor) {
      this.actors = [options.actor];
    }
    this.target = options.target;
    this.game = options.game;
    this.meeting = options.meeting;
    this.run = options.run.bind(this);
    this.unboundRun = options.run;
    this.labels = options.labels || [];
    this.priority = options.priority || 0;
    this.delay = options.delay || 0;
    this.power = options.power || 1;
    this.effect = options.effect;
    this.item = options.item;
    this.event = options.event;
    this.achievement = options.achievement;

    this.priority += this.actor?.role?.priorityOffset ?? 0;
  }

  do() {
    this.run();
  }

  /**
   * Checks if this action's target is immune to it or not
   * @param {Player} player the target. If undefined, defaults to this action's target
   * @param {boolean} emitEvent whether an immune event should occur or not. Set to false
   *  if the caller would not actually subsequently result in the action being checked for
   * @returns {boolean} true if the target lacks immunity to this action
   */
  dominates(player, emitEvent = true) {
    player = player || this.target;
    // will be true if immune to any label
    let immune = false;

    for (let label of this.labels) {
      // power 2 immunity can overwrite power 2 action
      // power 3 cancel immunity can overwrite power 3 immunity
      let immunity = player.getImmunity(label);
      let cancelImmunity = player.getCancelImmunity(label);

      if (cancelImmunity > 0 && cancelImmunity >= immunity) {
        return true;
      }

      let immuneToLabel = immunity >= this.power;
      if (immuneToLabel) {
        immune = true;
        if (player.docImmunity && player.docImmunity.length > 0) {
          for (let i = 0; i < player.docImmunity.length; i++) {
            this.docSave(player.user.id, player.docImmunity[i].saver);
          }
        }
      }
    }

    if (emitEvent && immune) this.game.events.emit("immune", this, player);

    return !immune;
  }

  async docSave(userId, saverId) {
    await models.DocSave.findOne(
      {
        $or: [
          { $and: [{ userId: userId }, { saverId: saverId }] },
          { $and: [{ userId: saverId }, { saverId: userId }] },
        ],
      },
      async (err, saved) => {
        if (err) {
          console.log(err);
        } else if (!saved) {
          var docSave = new models.DocSave({
            userId: userId,
            saverId: saverId,
          });

          await docSave.save();
        }
      }
    );
  }

  hasLabel(label) {
    return this.labels.indexOf(label) != -1;
  }

  hasLabels(labels) {
    for (let label of labels)
      if (this.labels.indexOf(label) == -1) return false;

    return true;
  }

  cancel(stopAll) {
    this.actors.shift();

    if (this.actors.length == 0 || stopAll) {
      this.do = () => {};
      this.actors = [];
      delete this.target;
    }
  }

  cancelActor(actor) {
    var actorIndex = this.actors.indexOf(actor);
    if (actorIndex == -1) return;

    this.actors.splice(actorIndex, 1);

    if (this.actors.length == 0) {
      this.do = () => {};
      this.actors = [];
      delete this.target;
    }
  }

  get actor() {
    return this.actors[0];
  }

  set actor(_actor) {
    this.actors.unshift(_actor);
  }
};
