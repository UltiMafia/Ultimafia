const Item = require("../Item");
const Action = require("../Action");
const Random = require("../../../../lib/Random");

module.exports = class Gun extends Item {
  constructor(options) {
    super("Gun");

    this.reveal = options?.reveal;
    this.shooterMask = options?.shooterMask;
    this.mafiaImmune = options?.mafiaImmune;
    this.magicCult = options?.magicCult;
    this.broken = options?.broken;
    this.useModifiers = options?.modifiers;

    this.baseMeetingName = "Shoot Gun";
    this.currentMeetingIndex = 0;

    this.meetings = {
      [this.baseMeetingName]: {
        actionName: "Shoot",
        states: ["Day"],
        flags: ["voting", "instant", "noVeg"],
        item: this,
        action: {
          labels: ["kill", "gun"],
          item: this,
          run: function () {
            this.item.drop();

            var shooterMask = this.item.shooterMask;
            var reveal = shooterMask ? true : this.item.reveal;
            if (reveal == null) {
              reveal = Random.randArrayVal([true, false]);
            }
            if (shooterMask == null) {
              shooterMask = this.actor.name;
            }

            var mafiaImmune = this.item.mafiaImmune;
            var magicBullet = this.item.magicCult;
            var broken = this.item.broken;

            if (this.item.useModifiers && this.item.modifiers) {
              if (this.item.modifiers.includes("Random")) {
                this.target = Random.randArrayVal(
                  this.game.alivePlayers().filter((p) => p != this.actor)
                );
              }
              if (this.item.modifiers.includes("Narcissistic")) {
                if (Random.randArrayVal([true, false])) {
                  this.target = this.actor;
                }
              }
              //Modifier that don't change target
              if (!this.item.isTargetValid(this.target)) {
                this.actor.queueAlert(`Your gun has no effect on your target!`);
                return;
              }
            }
            this.game.broadcast("gunshot");

            if (broken) {
              this.target = this.actor;
            }
            /*
             this.game.queueAlert(
                `Use Mods ${this.item.useModifiers} , Mods ${this.item.modifiers}!`
              );
              */
            if (reveal && broken)
              this.game.queueAlert(
                `:gunfab: ${shooterMask} pulls a gun, it backfires!`
              );
            else if (reveal && !broken)
              this.game.queueAlert(
                `:gun: ${shooterMask} pulls a gun and shoots at ${this.target.name}!`
              );
            else
              this.game.queueAlert(
                `:gun: Someone fires a gun at ${this.target.name}!`
              );

            if (this.item.useModifiers && this.item.modifiers) {
              let selfKill = new Action({
                actor: this.actor,
                target: this.actor,
                game: this.game,
                labels: ["kill", "hidden"],
                run: function () {
                  if (this.dominates()) {
                    this.target.kill("basic", this.actor, true);
                  }
                },
              });
              if (this.item.modifiers.includes("Sacrificial")) {
                selfKill.do();
              }
              if (
                this.item.modifiers.includes("Vain") &&
                this.target.getFaction() == this.actor.getFaction()
              ) {
                selfKill.do();
              }
              if (
                this.item.modifiers.includes("Weak") &&
                this.target.getFaction() != this.actor.getFaction()
              ) {
                selfKill.do();
              }
            }

            // convert or kill
            if (magicBullet && this.target.getRoleAlignment() !== "Cult") {
              let action = new Action({
                actor: this.actor,
                target: this.target,
                game: this.game,
                labels: ["convert", "hidden"],
                run: function () {
                  if (this.dominates()) this.target.setRole("Cultist");
                },
              });
              action.do();
              return;
            }

            // kill
            if (mafiaImmune && this.target.getFaction() != this.actor.getFaction())
              return;

            if (this.dominates()) {
              this.target.kill("gun", this.actor, true);

              if (
                this.item.useModifiers &&
                this.item.modifiers &&
                this.item.modifiers.includes("Regretful")
              ) {
                let selfKill2 = new Action({
                  actor: this.actor,
                  target: this.actor,
                  game: this.game,
                  labels: ["kill", "hidden"],
                  run: function () {
                    if (this.dominates()) {
                      this.target.kill("basic", this.actor, true);
                    }
                  },
                });
                selfKill2.do();
              }
            }
          },
        },
      },
    };
  }

  get snoopName() {
    if (this.mafiaImmune) {
      return "Gun (Gunrunner)";
    } else if (this.magicCult) {
      return "Gun (Gremlin)";
    } else if (this.broken) {
      return "Gun (Broken)";
    }

    return this.name;
  }

  getMeetingName(idx) {
    return `${this.id} ${idx}`;
  }

  hold(player) {
    super.hold(player);
    if (this.useModifiers == true) {
      this.modifiers = this.holder.role.modifier;
    }
  }

  getCurrentMeetingName() {
    if (this.currentMeetingIndex === 0) {
      return this.baseMeetingName;
    }

    return this.getMeetingName(this.currentMeetingIndex);
  }

  isTargetValid(player) {
    if (this.modifiers.includes("Loyal")) {
      if (player.getFaction() != this.holder.getFaction()) {
        return false;
      }
    }
    if (this.modifiers.includes("Disloyal")) {
      if (player.getFaction() == this.holder.getFaction()) {
        return false;
      }
    }
    if (
      player.getRoleName() == "Villager" ||
      player.getRoleName() == "Mafioso" ||
      player.getRoleName() == "Cultist" ||
      player.getRoleName() == "Grouch"
    ) {
      if (this.modifiers.includes("Complex")) {
        return false;
      }
    } else {
      if (this.modifiers.includes("Simple")) {
        return false;
      }
    }
    if (player.isDemonic()) {
      if (this.modifiers.includes("Holy")) {
        return false;
      }
    } else {
      if (this.modifiers.includes("Unholy")) {
        return false;
      }
    }
    if (player.role.data.banished) {
      if (this.modifiers.includes("Refined")) {
        return false;
      }
    } else {
      if (this.modifiers.includes("Unrefined")) {
        return false;
      }
    }
    return true;
  }

  // increase meeting name index to ensure each meeting name is unique
  incrementMeetingName() {
    let mtg = this.meetings[this.getCurrentMeetingName()];
    delete this.meetings[this.getCurrentMeetingName()];
    this.currentMeetingIndex += 1;
    this.meetings[this.getCurrentMeetingName()] = mtg;
  }
};
