const Card = require("../../Card");
const Action = require("../../Action");
const Random = require("../../../../../lib/Random");
const { CULT_FACTIONS } = require("../../const/FactionList");
const { PRIORITY_FULL_DISABLE } = require("../../const/Priority");

module.exports = class BecomeFakeCultRole extends Card {
  constructor(role) {
    super(role);

    //this.startItems = ["IsTheTelevangelist"];
    let banishedRoles = this.game.banishedRoles;
    let roles = this.role.getAllRoles().filter((r) => r);
    let currentRoles = [];
    let playersAll = this.game.players.filter((p) => p.role);
    for (let x = 0; x < playersAll.length; x++) {
      //currentRoles.push(playersAll[x].role);
      let tempName = playersAll[x].role.name;
      let tempModifier = playersAll[x].role.modifier;
      currentRoles.push(`${tempName}:${tempModifier}`);
    }
    for (let y = 0; y < currentRoles.length; y++) {
      roles = roles.filter(
        (r) => r != currentRoles[y] && !currentRoles[y].includes(r)
      );
    }
    roles = roles.filter((r) => !r.toLowerCase().includes("banished"));
    roles = roles.filter((r) => this.game.getRoleAlignment(r) == "Cult");
    roles = roles.filter(
      (r) =>
        this.game.getRoleTags(r).includes("Endangered") ||
        this.game.getRoleTags(r).includes("Kills Cultist") ||
        this.game.getRoleTags(r).includes("Demonic")
    );
    let excessEndangered = roles;

    roles = currentRoles;
    roles = roles.filter((r) => this.game.getRoleAlignment(r) == "Cult");
    roles = roles.filter(
      (r) =>
        this.game.getRoleTags(r).includes("Endangered") ||
        this.game.getRoleTags(r).includes("Kills Cultist") ||
        this.game.getRoleTags(r).includes("Demonic")
    );
    roles = roles.filter((r) => r.split(":")[0] != "Televangelist");

    if (roles.length <= 0) {
      roles = excessEndangered;
      roles = roles.filter((r) => this.game.getRoleAlignment(r) == "Cult");
      roles = roles.filter(
        (r) =>
          this.game.getRoleTags(r).includes("Endangered") ||
          this.game.getRoleTags(r).includes("Kills Cultist") ||
          this.game.getRoleTags(r).includes("Demonic")
      );
      roles = roles.filter((r) => r.split(":")[0] != "Televangelist");
    }
    if (roles.length <= 0) {
      roles = [`Imp:Demonic`];
    }

    role.player.factionFake = "Cult";

    role.newRole = Random.randArrayVal(roles);
    let tempApp = {
      self: role.newRole,
      reveal: role.newRole,
    };
    this.editAppearance(tempApp);

    this.listeners = {
      SwitchRoleBefore: function (player) {
        if (player != this.player) return;
        switchRoleBefore(this.player.role);
        this.player.role.data.reroll = true;
        //this.player.holdItem("IsTheTelevangelist", this.player.role.modifier);

        let role = this.player.addExtraRole(this.player.role.newRole);
        this.giveEffect(player, "Delirious", Infinity, this);
        this.player.passiveExtraRoles.push(role);
        role.isTelevangelistExtra = true;
      },
      roleAssigned: function (player) {
        if (player !== this.player) {
          return;
        }
        let meetingName = `Fake Cult Meeting with ${player.name}`;
        let meetAction = `Fake Cult Action with ${player.name}`;
        this.player.holdItem(
          "FakeCultMeeting",
          meetingName,
          meetAction,
          this.game
        );
        for (let player2 of this.game.alivePlayers()) {
          if (
            player2.faction == "Cult" &&
            player2.role.alignment != "Independent" &&
            !player2.role.modifier.split("/").includes("Demonic")
          ) {
            player2.holdItem(
              "FakeCultMeeting",
              meetingName,
              meetAction,
              this.game
            );
          } else if (
            this.game
              .getRoleTags(player2.role.name)
              .includes("Faction Meeting Interaction")
          ) {
            player2.holdItem(
              "FakeCultMeeting",
              meetingName,
              meetAction,
              this.game
            );
          }
        }
        if (this.data.reroll) {
          return;
        }
        if(this.hasGainedTeleRole == true){
          return;
        }
        this.hasGainedTeleRole = true;
        let role = this.player.addExtraRole(this.player.role.newRole);
        //this.giveEffect(player, "Delirious", Infinity, this);
        this.player.passiveExtraRoles.push(role);
        role.isTelevangelistExtra = true;

        /*
        //this.player.holdItem("IsTheTelevangelist", this.player.role.modifier);
        let tempModifier = this.player.role.modifier;
        this.player.setRole(
          this.newRole,
          undefined,
          false,
          true,
          false,
          "No Change",
          "RemoveStartingItems"
        );
        this.player.role.name = "Televangelist";
        let tempApp = {
          self: this.newRole,
        };
        this.player.role.editAppearance(tempApp);

        let role = this.player.addExtraRole(`${"Villager"}:${tempModifier}`);
        this.player.passiveExtraRoles.push(role);
    */
      },
      state: function (stateInfo) {
        if (!stateInfo.name.match(/Night/)) {
          return;
        }
        let meetingName = `Fake Cult Meeting with ${this.player.name}`;
        let meetAction = `Fake Cult Action with ${this.player.name}`;

        this.player.holdItem(
          "FakeCultMeeting",
          meetingName,
          meetAction,
          this.game
        );
        for (let player of this.game.alivePlayers()) {
          if (
            player.faction == "Cult" &&
            player.role.alignment != "Independent" &&
            !player.role.modifier.split("/").includes("Demonic")
          ) {
            player.holdItem(
              "FakeCultMeeting",
              meetingName,
              meetAction,
              this.game
            );
          } else if (
            this.game
              .getRoleTags(player.role.name)
              .includes("Faction Meeting Interaction")
          ) {
            player.holdItem(
              "FakeCultMeeting",
              meetingName,
              meetAction,
              this.game
            );
          }
        }
      },
      AbilityToggle: function (player) {
        let checks = true;
        if (!this.hasAbility(["Win-Con", "WhenDead"])) {
          checks = false;
        }

        if (checks == true) {
          if (
            this.TeleEffect == null ||
            !this.player.effects.includes(this.TeleEffect)
          ) {
            this.TeleEffect = this.player.giveEffect(
              "TelevangelistEffect",
              Infinity
            );
            this.passiveEffects.push(this.TeleEffect);
          }
        } else {
          var index = this.passiveEffects.indexOf(this.TeleEffect);
          if (index != -1) {
            this.passiveEffects.splice(index, 1);
          }
          if (this.TeleEffect != null) {
            this.TeleEffect.remove();
            this.TeleEffect = null;
          }
        }
      },
      vote: function (vote) {
        if (vote.voter == this.player) {
          for (let player of this.game.players) {
            if (player.id == vote.target) {
              var action = new Action({
                actor: this.player,
                target: player,
                game: this.player.game,
                priority: 0,
                role: this.role,
                labels: ["hidden", "absolute", "condemn", "overthrow"],
                run: function () {
                  for (let player of this.game.players) {
                    if (player.faction != "Cult") {
                      continue;
                    }
                    player.queueAlert(
                      `${this.actor.name} has selected ${this.target.name}.`
                    );
                  }
                },
              });
              this.game.instantAction(action);
              return;
            }
          }
          var action2 = new Action({
            actor: this.player,
            target: vote.target,
            game: this.player.game,
            priority: 0,
            role: this.role,
            labels: ["hidden", "absolute", "condemn", "overthrow"],
            run: function () {
              for (let player of this.game.players) {
                if (player.faction != "Cult") {
                  continue;
                }
                player.queueAlert(
                  `${this.actor.name} has selected ${this.target}.`
                );
              }
            },
          });
          this.game.instantAction(action2);
        }
      },
    };

    this.passiveActions = [
      {
        ability: ["WhenDead", "Block"],
        state: "Night",
        actor: role.player,
        game: role.player.game,
        priority: PRIORITY_FULL_DISABLE,
        labels: ["block", "hidden"],
        role: role,
        run: function () {
          for (let action of this.game.actions[0]) {
            if (action.actor == this.actor) {
              if (action.role.isTelevangelistExtra == true) {
                if (
                  action.labels.includes("investigate") ||
                  action.labels.includes("charge")
                ) {
                  continue;
                } else if (action.labels.includes("Uncharge")) {
                  let tempRun = function () {
                    this.role.revived = false;
                  };
                  action.run = tempRun.bind(action);
                } else {
                  let tempRun = function () {};
                  action.run = tempRun.bind(action);
                }
              }
            }
          }
        },
      },
    ];
  }
};

function switchRoleBefore(role) {
  let roles = role.getAllRoles().filter((r) => r);
  let currentRoles = [];
  let playersAll = role.game.players.filter((p) => p.role);
  for (let x = 0; x < playersAll.length; x++) {
    //currentRoles.push(playersAll[x].role);
    let tempName = playersAll[x].role.name;
    let tempModifier = playersAll[x].role.modifier;
    currentRoles.push(`${tempName}:${tempModifier}`);
  }
  for (let y = 0; y < currentRoles.length; y++) {
    roles = roles.filter(
      (r) => r != currentRoles[y] && !currentRoles[y].includes(r)
    );
  }
  roles = roles.filter((r) => !r.toLowerCase().includes("banished"));
  roles = roles.filter((r) => role.game.getRoleAlignment(r) == "Cult");
  roles = roles.filter(
    (r) =>
      role.game.getRoleTags(r).includes("Endangered") ||
      role.game.getRoleTags(r).includes("Kills Cultist") ||
      role.game.getRoleTags(r).includes("Demonic")
  );
  let excessEndangered = roles;

  roles = currentRoles;
  roles = roles.filter((r) => role.game.getRoleAlignment(r) == "Cult");
  roles = roles.filter(
    (r) =>
      role.game.getRoleTags(r).includes("Endangered") ||
      role.game.getRoleTags(r).includes("Kills Cultist") ||
      role.game.getRoleTags(r).includes("Demonic")
  );
  roles = roles.filter((r) => r.split(":")[0] != "Televangelist");

  if (roles.length <= 0) {
    roles = excessEndangered;
    roles = roles.filter((r) => role.game.getRoleAlignment(r) == "Cult");
    roles = roles.filter(
      (r) =>
        role.game.getRoleTags(r).includes("Endangered") ||
        role.game.getRoleTags(r).includes("Kills Cultist") ||
        role.game.getRoleTags(r).includes("Demonic")
    );
    roles = roles.filter((r) => r.split(":")[0] != "Televangelist");
  }
  if (roles.length <= 0) {
    roles = [`Imp:Demonic`];
  }

  role.player.factionFake = "Cult";

  role.newRole = Random.randArrayVal(roles);
  let tempApp = {
    self: role.newRole,
    reveal: role.newRole,
  };
  role.editAppearance(tempApp);
}
