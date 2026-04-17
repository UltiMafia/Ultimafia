const Card = require("../../Card");
const { PRIORITY_INVESTIGATIVE_DEFAULT } = require("../../const/Priority");
<<<<<<< HEAD
const roleData = require("../../../../../data/roles");
=======
>>>>>>> 01ab78ec4a98b815ee4ce301502f3a59462cd540

module.exports = class TutorTarget extends Card {
  constructor(role) {
    super(role);

<<<<<<< HEAD
    this.listeners = {
      state: function (stateInfo) {
        if (stateInfo.name.match(/Night/)) {
          this.player.role.data.prevTargets = [...(this.player.role.data.currentNightTargets || [])];
          this.player.role.data.actionFiredThisNight = false;
          this.player.role.data.currentNightTargets = [];

          if (!this.player.role.data.tutorTargets || !this.player.role.data.tutorTargets.length) return;

          if (this.player.role.data.tutorAlerted) {
            for (let entry of this.player.role.data.tutorTargets) {
              if (entry.alerted) {
                entry.nightPassed = true;
              }
            }
            this.player.role.data.tutorNightPassed = true;
          }
          return;
        }

        if (stateInfo.name.match(/Day/)) {
          if (!this.player.role.data.tutorTargets || !this.player.role.data.tutorTargets.length) return;

          const unalerted = this.player.role.data.tutorTargets.filter(e => !e.alerted);
          for (let entry of unalerted) {
            const target = this.game.players.filter(
              (p) => p.id === entry.targetId
            )[0];
            if (!target || !target.alive) {
              entry.alerted = true;
              continue;
            }

            target.setRole(entry.chosenRole, undefined, false, false, true, "No Change");
            Object.assign(target.role.data, entry.savedRoleData);
            entry.alerted = true;

            target.queueAlert(
              `:star: You have been tutored into ${entry.chosenRole}!`
            );
          }

          if (unalerted.length > 0) {
            this.player.role.data.tutorAlerted = true;
          }

          const toRevert = this.player.role.data.tutorTargets.filter(e => e.alerted && e.nightPassed);
          if (toRevert.length > 0) {
            const remaining = this.player.role.data.tutorTargets.filter(e => !(e.alerted && e.nightPassed));

            for (let entry of toRevert) {
              const target = this.game.players.filter(
                (p) => p.id === entry.targetId
              )[0];
              if (!target || !target.alive) continue;
              target.setRole(entry.originalRole, undefined, false, false, true, "No Change");
            }

            this.player.role.data.tutorTargets = remaining;

            if (this.player.role.data.tutorTargets.length === 0) {
              this.player.role.data.tutorAlerted = false;
              this.player.role.data.tutorNightPassed = false;
            }
          }
        }
      },

      death: function (player) {
        if (player !== this.player) return;
        if (!this.player.role.data.tutorTargets || !this.player.role.data.tutorTargets.length) return;

        for (let entry of this.player.role.data.tutorTargets) {
          if (!entry.alerted) continue;
          const target = this.game.players.filter(
            (p) => p.id === entry.targetId
          )[0];
          if (!target || !target.alive) continue;
          target.setRole(entry.originalRole, undefined, false, false, true, "No Change");
        }

        this.player.role.data.tutorTargets = [];
        this.player.role.data.tutorAlerted = false;
        this.player.role.data.tutorNightPassed = false;
      },
    };

=======
>>>>>>> 01ab78ec4a98b815ee4ce301502f3a59462cd540
    this.meetings = {
      Tutor: {
        states: ["Night"],
        flags: ["voting"],
<<<<<<< HEAD
        targets: { include: ["alive"], exclude: ["self", isPrevTarget] },
=======
>>>>>>> 01ab78ec4a98b815ee4ce301502f3a59462cd540
        action: {
          labels: ["visit", "tutor"],
          ability: ["Information", "Conversion"],
          priority: PRIORITY_INVESTIGATIVE_DEFAULT,
          run: function () {
<<<<<<< HEAD
            const game = this.game;
            const target = this.target;

            if (!this.role.data.actionFiredThisNight) {
              this.role.data.actionFiredThisNight = true;
              this.role.data.currentNightTargets = [];
            }

            if (!this.role.data.currentNightTargets) {
              this.role.data.currentNightTargets = [];
            }

            this.role.data.currentNightTargets.push(target);

            if (target.role.alignment !== "Village") return;

            const banishedRoleNames = (game.PossibleRoles || [])
              .filter(r => r.split(":")[1] === "Banished")
              .map(r => r.split(":")[0]);

            const infoRoles = Object.entries(roleData.Mafia)
              .filter(([roleName, data]) =>
                data.tags &&
                data.tags.includes("Information") &&
                data.alignment === "Village" &&
                roleName !== "Tutor" &&
                roleName !== target.role.name &&
                !banishedRoleNames.includes(roleName)
              )
              .map(([roleName]) => roleName);
=======
            if (this.target.role.alignment !== "Village") return;

            const game = this.game;
            const target = this.target;

            const infoRoles = game.getRolesByTag("Information").filter(
              (roleName) =>
                roleName !== "Tutor" &&
                roleName !== target.role.name
            );
>>>>>>> 01ab78ec4a98b815ee4ce301502f3a59462cd540

            if (!infoRoles.length) return;

            const chosenRoleName =
              infoRoles[Math.floor(Math.random() * infoRoles.length)];

<<<<<<< HEAD
            const savedRoleData = Object.assign({}, target.role.data);

            if (!this.role.data.tutorTargets) {
              this.role.data.tutorTargets = [];
            }

            const existing = this.role.data.tutorTargets.filter(
              (e) => e.targetId === target.id
            )[0];

            if (existing) {
              existing.chosenRole = chosenRoleName;
              existing.savedRoleData = savedRoleData;
            } else {
              this.role.data.tutorTargets.push({
                targetId: target.id,
                originalRole: target.role.name,
                chosenRole: chosenRoleName,
                savedRoleData: savedRoleData,
                alerted: false,
                nightPassed: false,
              });
            }
=======
            if (!target.role.data.tutorOriginalRole) {
              target.role.data.tutorOriginalRole = target.role.name;
            }

            const RoleClass = game.getRoleClass(chosenRoleName);
            if (!RoleClass) return;

            game.changeRole(target, RoleClass, { alignment: "Village" });

            if (!target.role.data.tutorRevertQueued) {
              target.role.data.tutorRevertQueued = true;

              game.once("phaseBegin:Night", function () {
                game.once("phaseBegin:Day", function () {
                  if (!target.alive) return;

                  const originalRoleName = target.role.data.tutorOriginalRole;
                  if (!originalRoleName) return;

                  const OriginalClass = game.getRoleClass(originalRoleName);
                  if (OriginalClass) {
                    game.changeRole(target, OriginalClass, { alignment: "Village" });
                  }

                  target.role.data.tutorOriginalRole = null;
                  target.role.data.tutorRevertQueued = false;
                });
              });
            }

            game.once("phaseBegin:Day", function () {
              var alert = `:star: You have been tutored into ${chosenRoleName}!`;
              game.queueAlert(alert, 0, [target]);
            });
>>>>>>> 01ab78ec4a98b815ee4ce301502f3a59462cd540
          },
        },
      },
    };
  }
<<<<<<< HEAD
};

function isPrevTarget(player) {
  return this.role &&
    this.role.data.prevTargets &&
    this.role.data.prevTargets.includes(player);
}
=======
};
>>>>>>> 01ab78ec4a98b815ee4ce301502f3a59462cd540
