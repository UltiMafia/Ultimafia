const Item = require("../Item");
const Action = require("../Action");
const Event = require("../Event");
const Random = require("../../../../lib/Random");
const roles = require("../../../../data/roles");
const {
  PRIORITY_ITEM_GIVER_DEFAULT,
  PRIORITY_BECOME_DEAD_ROLE,
} = require("../const/Priority");

module.exports = class EventManager extends Item {
  constructor(lifespan) {
    super("EventManager");

    this.lifespan = lifespan || Infinity;
    this.cannotBeStolen = true;
    this.cannotBeSnooped = true;

    this.listeners = {
      ManageRandomEvents: function () {
        if (this.game.getStateName() != "Night") return;
        let event;
        let eventMods;
        let eventName;
        if (this.game.PossibleEvents.length > 0 && !this.game.selectedEvent) {
          let Events = this.game.PossibleEvents.filter((e) =>
            this.game.checkEvent(e.split(":")[0],e.split(":")[1]) == true
          );
          if (Events.length <= 0) {
            //this.game.queueAlert("Failed Checks");
            this.drop();
            return;
          }
          event = Random.randArrayVal(Events);
          eventMods = event.split(":")[1];
          eventName = event.split(":")[0];
          //this.game.queueAlert(`Manager ${eventMods}`);
          event = this.game.createGameEvent(eventName,eventMods);
          event.doEvent();
          event = null;
          this.game.selectedEvent = true;
          this.drop();
        } else {
          this.drop();
          return;
        }

        /*

        if (eventName == "Missing Supplies") {
          let victim = Random.randArrayVal(this.game.alivePlayers());
          this.action = new Action({
            actor: this.holder,
            target: victim,
            game: this.game,
            priority: PRIORITY_ITEM_GIVER_DEFAULT,
            item: this,
            labels: ["hidden", "absolute"],
            run: function () {
              if (this.game.SilentEvents != false) {
                this.game.queueAlert(
                  `Event: Missing Supplies, The Sheriff's Office has reported a Missing Gun!`
                );
              }
              this.target.holdItem("Gun");
            },
          });
          this.game.queueAction(this.action);
          this.drop();
          return;
        }

        if (eventName == "Evolution") {
          //let victim = Random.randArrayVal(this.game.alivePlayers());
          this.action = new Action({
            actor: this.holder,
            target: this.holder,
            game: this.game,
            priority: PRIORITY_BECOME_DEAD_ROLE,
            item: this,
            labels: ["hidden", "absolute"],
            run: function () {
              let vanillaPlayers = this.game
                .alivePlayers()
                .filter(
                  (p) =>
                    p.role.name == "Villager" ||
                    p.role.name == "Mafioso" ||
                    p.role.name == "Cultist" ||
                    p.role.name == "Grouch"
                );
              if (vanillaPlayers.length <= 0) return;

              if (this.game.SilentEvents != false) {
                this.game.queueAlert(
                  `Event: Evolution, Some Chemicals got spilled into the non-pr role's Drinking water!`
                );
              }
              let victim = Random.randArrayVal(vanillaPlayers);
              const randomAlignedRole = Random.randArrayVal(
                Object.entries(roles.Mafia)
                  .filter(
                    (roleData) =>
                      roleData[1].alignment === victim.role.alignment
                  )
                  .map((roleData) => roleData[0])
              );
              victim.setRole(
                randomAlignedRole,
                null,
                false,
                false,
                false,
                "No Change"
              );
            },
          });
          this.game.queueAction(this.action);
          this.drop();
          return;
        }

        if (eventName == "Time Loop") {
          //let victim = Random.randArrayVal(this.game.alivePlayers());
          let L = function () {
            if (this.role.data.doTimeLoop == true) {
              this.role.data.doTimeLoop = false;
              return true;
            } else {
              return false;
            }
          };
          L = L.bind(this.holder);
          this.holder.role.data.doTimeLoop = true;
          this.game.PossibleEvents[this.game.PossibleEvents.indexOf(event)] =
            "No Event";
          this.game.setStateShouldSkip("Day", L);
          this.action = new Action({
            actor: this.holder,
            target: this.holder,
            game: this.game,
            priority: PRIORITY_BECOME_DEAD_ROLE,
            item: this,
            labels: ["hidden", "absolute"],
            run: function () {
              if (this.game.SilentEvents != false) {
                this.game.queueAlert(`Event: Time Loop, It's Night Again!`);
              }
              //this.game.setStateShouldSkip("Day", true);
            },
          });
          this.game.queueAction(this.action);
          return;
        }

        if (eventName == "Brainblast") {
          let victim = Random.randArrayVal(this.game.alivePlayers());
          this.action = new Action({
            actor: this.holder,
            target: victim,
            game: this.game,
            priority: PRIORITY_ITEM_GIVER_DEFAULT,
            item: this,
            labels: ["hidden", "absolute"],
            run: function () {
              if (this.game.SilentEvents != false) {
                this.game.queueAlert(
                  `Event: Brainblast, A player got a brainblast and can learn another player's role!`
                );
              }
              let targetTypes = ["neighbors", "even", "odd"];
              let targetType = Random.randArrayVal(targetTypes);
              this.target.holdItem("WackyRoleLearner", targetType, "Day");
            },
          });
          this.game.queueAction(this.action);
          this.drop();
          return;
        }
        */
      },
    };
  }
};
