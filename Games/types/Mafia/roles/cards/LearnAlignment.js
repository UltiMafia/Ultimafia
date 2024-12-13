const Card = require("../../Card");
const { PRIORITY_INVESTIGATIVE_DEFAULT } = require("../../const/Priority");
const Random = require("../../../../../lib/Random");

module.exports = class LearnAlignment extends Card {
  constructor(role) {
    super(role);

    this.meetings = {
      Investigate: {
        states: ["Night"],
        flags: ["voting"],
        action: {
          labels: ["investigate", "alignment"],
          priority: PRIORITY_INVESTIGATIVE_DEFAULT,
          run: function () {
            let info = this.game.createInformation(
              "BinaryAlignmentInfo",
              this.actor,
              this.game,
              this.target
            );
            info.processInfo();
            var alignment = info.getInfoRaw();
            //this.actor.queueAlert(alert);

            //insane cop
            if (this.actor.role.name == "Insane Cop") {
              if (alignment == `Innocent`) alignment = "Guilty";
              else alignment = `Innocent`;
            }
            //confused cop
            if (this.actor.role.name == "Confused Cop") {
              alignment = Random.randArrayVal(["Innocent", "Guilty"]);
            }
            // naive cop
            if (this.actor.role.name == "Naive Cop") {
              alignment = "Innocent";
            }
            // paranoid cop
            if (this.actor.role.name == "Paranoid Cop") {
              if (this.target.role.name === "Alien") alignment = "an Alien!";
              else alignment = "Guilty";
            }

            var alert = `:invest: After investigating, you learn that your Target is ${alignment}!`;
            this.game.queueAlert(alert, 0, this.meeting.getPlayers());

            /*
            var role = this.target.getAppearance("investigate", true);
            var alignment = this.game.getRoleAlignment(role);
            //sane cop
            if (this.actor.role.name == "Cop") {
              if (alignment == "Village" || alignment == "Independent")
                alignment = "innocent";
              else alignment = `guilty`;
            }
            //insane cop
            if (this.actor.role.name == "Insane Cop") {
              if (alignment == "Village" || alignment == "Independent")
                alignment = "guilty";
              else alignment = `innocent`;
            }
            //confused cop
            if (this.actor.role.name == "Confused Cop") {
              alignment = Random.randArrayVal(this.game.getAllAlignments());
            }
            // naive cop
            if (this.actor.role.name == "Naive Cop") {
              alignment = "innocent";
            }
            // paranoid cop
            if (this.actor.role.name == "Paranoid Cop") {
              if (this.target.role.name === "Alien") alignment = "an Alien!";
              else alignment = "guilty";
            }

            if (this.actor.hasEffect("FalseMode")) {
              if (
                this.target.role.alignment == "Village" ||
                this.target.role.alignment == "Independent"
              ) {
                alignment = "guilty";
              } else {
                alignment = `innocent`;
              }
            }

            var alert = `:invest: After investigating, you learn that ${this.target.name} is ${alignment}!`;
            this.game.queueAlert(alert, 0, this.meeting.getPlayers());
            */
          },
        },
      },
    };
  }
};
