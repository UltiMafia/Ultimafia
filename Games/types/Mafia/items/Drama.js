const Item = require("../Item");

module.exports = class Drama extends Item {
  constructor(meetingName, dramaQueen, dramaTarget) {
    super("StartDrama");

    this.lifespan = 1;
    this.meetingName = meetingName;
    this.dramaQueen = dramaQueen;
    this.dramaTarget = dramaTarget;
    this.cannotBeStolen = true;

    this.meetings[meetingName] = {
      actionName: "Drama",
      states: ["Day"],
      flags: [
        "group",
        "voting",
        "mustAct",
        "instant",
        "votesInvisible",
        "noUnvote",
        "multiSplit",
        "hideAfterVote",
        "Important",
      ],
      inputType: "custom",
      targets: ["Reveal the truth", "Argue with drama queen"],
      shouldMeet: function (meetingName) {
        let startDrama = this.player.getItemProp(
          "StartDrama",
          "meetingName",
          meetingName
        );
        return !!(
          startDrama?.dramaQueen.alive && startDrama?.dramaTarget.alive
        );
      },
      action: {
        item: this,
        run: function () {
          let dramaQueen = this.item.dramaQueen;
          let dramaTarget = this.item.dramaTarget;

          if (this.meeting.votes[dramaTarget.id] === "Reveal the truth") {
            this.game.queueAlert(
              dramaTarget.name +
                " decided to reveal the truth and end the drama!"
            );
            //dramaTarget.role.revealToAll();
            let info = this.game.createInformation(
              "RevealInfo",
              dramaQueen,
              this.game,
              dramaTarget,
              null,
              "All"
            );
            info.processInfo();
            info.getInfoRaw();
          } else {
            this.game.queueAlert(
              dramaTarget.name +
                " will not stand for drama queen's accusations. Their arguing made " +
                dramaQueen.name +
                " well known as the drama queen."
            );

            dramaQueen.role.revealToAll();
            dramaQueen.role.data.canStartDrama = false;
          }
        },
      },
    };
  }
};
