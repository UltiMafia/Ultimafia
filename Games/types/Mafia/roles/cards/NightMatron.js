const Card = require("../../Card");
const Action = require("../../Action");
const { MEETING_PRIORITY_MATRON } = require("../../const/MeetingPriority");
const { PRIORITY_ITEM_GIVER_DEFAULT } = require("../../const/Priority");

module.exports = class NightMatron extends Card {
  constructor(role) {
    super(role);

    this.listeners = {
      roleAssigned: function (player) {
        if (player !== this.player) {
          return;
        }

        this.data.meetingName = "Common Room with " + this.player.name;
        this.meetings[this.data.meetingName] =
          this.meetings["CommonRoomPlaceholder"];
        delete this.meetings["CommonRoomPlaceholder"];
      },
      state: function (stateInfo) {
        if (!this.player.hasAbility(["Meeting"])) {
          return;
        }

        if (!stateInfo.name.match(/Night/)) {
          return;
        }

        var action = new Action({
          actor: this.player,
          game: this.player.game,
          priority: PRIORITY_ITEM_GIVER_DEFAULT,
          labels: ["giveItem", "hidden"],
          role: this.role,
          run: function () {
            let visitors = this.getVisitors(this.actor);
            visitors.map((v) =>
              v.holdItem("CommonRoomPassword", this.role.data.meetingName)
            );
            this.actor.holdItem(
              "CommonRoomPassword",
              this.role.data.meetingName
            );
          },
        });

        this.game.queueAction(action);
      },
    };

    this.meetings = {
      CommonRoomPlaceholder: {
        meetingName: "Common Room",
        actionName: "End Common Room Meeting?",
        states: ["Night"],
        flags: ["group", "speech", "voting", "mustAct", "noVeg"],
        inputType: "boolean",
        priority: MEETING_PRIORITY_MATRON,
        shouldMeet: function () {
          for (let player of this.game.players)
            if (
              player.hasItemProp(
                "CommonRoomPassword",
                "meetingName",
                this.data.meetingName
              )
            ) {
              return true;
            }

          return false;
        },
      },
    };
    /*
    this.actions = [
      {
        priority: PRIORITY_ITEM_GIVER_DEFAULT,
        labels: ["giveItem", "hidden"],
        run: function () {
          if (this.game.getStateName() != "Night") return;

          let visitors = this.getVisitors(this.actor);
          visitors.map((v) =>
            v.holdItem("CommonRoomPassword", this.actor.role.data.meetingName)
          );
          this.actor.holdItem(
            "CommonRoomPassword",
            this.actor.role.data.meetingName
          );
        },
      },
    ];
    */
  }
};
