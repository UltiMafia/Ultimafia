const Item = require("../Item");
const Action = require("../Action");
const Random = require("../../../../lib/Random");
const { PRIORITY_KILL_DEFAULT } = require("../const/Priority");
const {
  EVIL_FACTIONS,
  NOT_EVIL_FACTIONS,
  CULT_FACTIONS,
  MAFIA_FACTIONS,
  FACTION_LEARN_TEAM,
  FACTION_WIN_WITH_MAJORITY,
  FACTION_WITH_MEETING,
  FACTION_KILL,
} = require("../const/FactionList");

module.exports = class LiveOrDie extends Item {
  constructor(Applier, players) {
    super("LiveOrDie");

    //this.reveal = reveal;
    this.lifespan = 1;
    this.cannotBeStolen = true;
    this.cannotBeSnooped = true;
    this.Applier = Applier;
    this.victims = players;
    this.meetings["Live or Die"] = {
      actionName: "Live or Die",
      states: ["Dawn"],
      inputType: "custom",
      targets: ["Live", "Die"],
      flags: ["voting", "instant"],
      whileDead: true,
      action: {
        labels: ["hidden"],
        item: this,
        run: function () {
          if (this.target == "Die") {
            this.item.Applier.role.data.PlayersChoosenDie = true;
            this.game.queueAction(
              new Action({
                actor: this.item.Applier,
                target: this.actor,
                game: this.actor.game,
                labels: ["kill"],
                priority: PRIORITY_KILL_DEFAULT + 1,
                run: function () {
                  if (this.dominates()) {
                    this.target.kill("basic", this.actor);
                  }
                },
              })
            );
          } else {
            this.game.queueAction(
              new Action({
                actor: this.item.Applier,
                target: this.actor,
                game: this.actor.game,
                labels: ["revive"],
                priority: PRIORITY_KILL_DEFAULT + 1,
                run: function () {
                  if (this.actor.role.data.PlayersChoosenDie != true) {
                    let temp = new Action({
                      actor: this.actor,
                      target: this.target,
                      game: this.actor.game,
                      labels: ["kill"],
                      priority: PRIORITY_KILL_DEFAULT + 1,
                      run: function () {
                        if (this.dominates()) {
                          this.target.kill("basic", this.actor);
                        }
                      },
                    });
                    if (temp.dominates(this.target)) {
                      this.target.kill("basic", this.actor);
                    }
                  } else if (this.dominates()) {
                    this.target.revive("basic", this.actor);
                  }
                },
              })
            );
          }

          let indexOf = this.item.victims.indexOf(this.actor);
          if (this.item.victims[parseInt(indexOf) + 1]) {
            let item = this.item.victims[parseInt(indexOf) + 1].holdItem(
              "LiveOrDie",
              this.item.Applier,
              this.item.victims
            );
            this.game.instantMeeting(item.meetings, [
              this.item.victims[parseInt(indexOf) + 1],
            ]);
          }
        },
      },
    };
  }

  hold(player) {
    super.hold(player);
    player.game.sendAlert(
      `${player.name} has been selected by ${this.Applier.role.name}!`
    );
    player.sendAlert(
      `You have been selected by ${this.Applier.role.name}, You must choose to live or die! If you and the other players All choose to live you All die!`
    );
  }
};
