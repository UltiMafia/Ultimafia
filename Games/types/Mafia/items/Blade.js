const Item = require("../Item");
const Action = require("../Action");
const Random = require("../../../../lib/Random");

module.exports = class Blade extends Item {
  constructor(user, target, charge, turn) {
    super("Blade");
    this.reveal = true;
    this.cannotBeSnooped = true;
    this.Turn = turn || 0;
    this.User = user;
    this.Enemy = target;
    this.charge = charge || 0;
    this.targets = ["Attack", "Defend", "Focus", "Charge"];
    if (this.charge == 0) {
      this.targets = ["Attack", "Defend", "Focus", "Charge"];
    }
    if (this.charge == 1) {
      this.targets = ["Attack+", "Defend+", "Focus+", "Charge"];
    }
    if (this.charge == 2) {
      if (this.User.role.alignment == "Village") {
        this.targets = [
          "Towntell Takedown",
          "FMPOV I'm Clear Defense",
          "Tunneling Focus",
          "FOS",
        ];
      }
      if (this.User.role.alignment == "Mafia") {
        this.targets = ["Mafia Mash", "WIFOM Defense", "Blitz Focus", "Bus"];
      }
      if (this.User.role.alignment == "Cult") {
        this.targets = ["Dark Arts", "Blood Ritual", "Worship", "Convert"];
      }
      if (this.User.role.alignment == "Independent") {
        this.targets = [
          "Triple Attack",
          "Entrench",
          "Adrenaline",
          "Chance Time",
        ];
      }
      if (this.User.role.name == "Samurai") {
        this.targets = [
          "Typhoon Slash",
          "Parry",
          "Focused Fury",
          "Final Slash",
        ];
      }
    }

    this.meetings = {
      Dueling: {
        actionName: "Battle",
        states: ["Day"],
        flags: [
          "voting",
          "mustAct",
          "instant",
          "votesInvisible",
          "noUnvote",
          "hideAfterVote",
          "Important",
        ],
        inputType: "custom",
        targets: this.targets,
        action: {
          labels: ["kill"],
          item: this,
          run: function () {
            this.actor.data.MoveHasBeenSelected = true;
            this.actor.data.MoveSelected = this.target;
            this.item.drop();

            if (
              this.item.Enemy &&
              this.item.Enemy.alive &&
              this.item.Enemy.data.MoveHasBeenSelected == true
            ) {
              let duelists = [this.actor, this.item.Enemy];
              duelists = Random.randomizeArray(duelists);

              //Special
              for (let player of duelists) {
                if (player.data.MoveSelected == "Chance Time") {
                  let stats = ["Pain", "Pain", "Gain"];
                  let toIncrease = Random.randArrayVal(stats);
                  this.game.sendAlert(`${player.name} uses Chance Time!`);
                  if (toIncrease == "Pain") {
                    player.damage(15, "basic", player, true, true, true);
                  } else if (toIncrease == "Gain") {
                    this.game.sendAlert(`${player.name} gains a Gun.`);
                    let gun = player.holdItem("Gun");
                    this.game.instantMeeting(gun.meetings, [player]);
                  }
                }
                if (player.data.MoveSelected == "Bus") {
                  player.data.Charge = 0;
                  let teammates = this.game
                    .alivePlayers()
                    .filter((p) => p.faction == player.faction && p != player);
                  let bus;
                  if (teammates.length <= 0) {
                    this.game.sendAlert(
                      `${player.name} uses Bus! ${player.name} had no teammates to Bus.`
                    );
                  } else {
                    bus = Random.randArrayVal(teammates);
                    this.game.sendAlert(
                      `${player.name} uses Bus! ${player.name} is Busing ${bus.name}.`
                    );
                    duelists[duelists.indexOf(player)] = bus;
                    if (bus.def == null) {
                      bus.def = 10;
                      bus.atk = 10;
                      bus.crit = 1;
                    }
                  }
                }
              }
              //Debuff
              for (let player of duelists) {
                let otherPlayer;
                if (duelists.indexOf(player) == 0) {
                  otherPlayer = duelists[1];
                } else {
                  otherPlayer = duelists[0];
                }

                if (player.data.MoveSelected == "FOS") {
                  otherPlayer.atk -= 10;
                  otherPlayer.def -= 10;
                  this.game.sendAlert(
                    `${player.name} uses Fos! ${otherPlayer.name}'s attack power and block power decreased.`
                  );
                  player.data.Charge = 0;
                }
                if (player.data.MoveSelected == "Convert") {
                  otherPlayer.data.ConversionProgress += Random.randInt(20, 50);
                  if (otherPlayer.data.ConversionProgress >= 100) {
                    let action = new Action({
                      actor: player,
                      target: otherPlayer,
                      game: this.game,
                      labels: ["convert", "hidden"],
                      run: function () {
                        if (this.dominates()) this.target.setRole("Cultist");
                      },
                    });
                    action.do();
                  }
                  this.game.sendAlert(
                    `${player.name} uses Convert! ${otherPlayer.name} is now ${otherPlayer.data.ConversionProgress}% Converted.`
                  );
                  player.data.Charge = 0;
                }
              }
              //Defend Actions
              for (let player of duelists) {
                if (player.data.MoveSelected == "Defend") {
                  let block = Random.randInt(player.def - 3, player.def + 5);
                  player.data.Block += block;
                  this.game.sendAlert(
                    `${player.name} uses Defend! They gain ${block} Block.`
                  );
                  player.queueAlert(`You now have ${player.data.Block} Block!`);
                }
                if (player.data.MoveSelected == "Defend+") {
                  let block =
                    Random.randInt(player.def + 3, player.def + 10) * 2;
                  player.data.Block += block;
                  this.game.sendAlert(
                    `${player.name} uses Defend+! They gain ${block} Block.`
                  );
                  player.queueAlert(`You now have ${player.data.Block} Block!`);
                  player.data.Charge = 0;
                }
                if (player.data.MoveSelected == "FMPOV I'm Clear Defense") {
                  let block =
                    Random.randInt(player.def + 5, player.def + 15) * 2;
                  player.data.Block += block;
                  let info = this.game.createInformation(
                    "RevealInfo",
                    player,
                    this.game,
                    player,
                    null,
                    "All"
                  );
                  info.processInfo();
                  info.getInfoRaw();
                  this.game.sendAlert(
                    `${player.name} uses FMPOV I'm Clear Defense! They gain ${block} Block and their Role is Revealed.`
                  );
                  player.queueAlert(`You now have ${player.data.Block} Block!`);
                  player.data.Charge = 0;
                }
                if (player.data.MoveSelected == "WIFOM Defense") {
                  let block =
                    Random.randInt(player.def + 2, player.def + 20) * 2;
                  player.data.Block += block;
                  for (let person of this.game.alivePlayers()) {
                    if (person.faction == "Village") {
                      person.giveEffect("Scrambled", -1);
                    }
                  }
                  this.game.sendAlert(
                    `${player.name} uses WIFOM Defense! They gain ${block} Block and All Village Aligned players are Scrambled.`
                  );
                  player.queueAlert(`You now have ${player.data.Block} Block!`);
                  player.data.Charge = 0;
                }
                if (player.data.MoveSelected == "Blood Ritual") {
                  player.data.blood += 40;
                  this.game.sendAlert(
                    `${player.name} uses Blood Ritual! They gain 40% Blood.`
                  );
                  player.data.Charge = 0;
                }
                if (player.data.MoveSelected == "Entrench") {
                  player.def += 12;
                  let block = Random.randInt(player.def, player.def + 7) * 2;
                  player.data.Block += block;
                  this.game.sendAlert(
                    `${player.name} uses Entrench! They gain ${block} Block and their blocking power is increased.`
                  );
                  player.queueAlert(`You now have ${player.data.Block} Block!`);
                  player.data.Charge = 0;
                }
                if (player.data.MoveSelected == "Parry") {
                  player.data.Parry = true;
                  let block = Random.randInt(player.def, player.def + 7) * 2;
                  player.data.Block += block;
                  this.game.sendAlert(
                    `${player.name} uses Parry! They gain ${block} Block and they are Parrying the next attack.`
                  );
                  player.queueAlert(`You now have ${player.data.Block} Block!`);
                  player.data.Charge = 0;
                }
              }
              //Attack Actions
              for (let player of duelists) {
                let otherPlayer;
                if (duelists.indexOf(player) == 0) {
                  otherPlayer = duelists[1];
                } else {
                  otherPlayer = duelists[0];
                }
                if (player.data.MoveSelected == "Attack") {
                  this.game.sendAlert(`${player.name} uses attack!`);
                  let damage = Random.randInt(player.atk, player.atk + 5);
                  //this.game.sendAlert(`${player.atk} Atk, ${damage} damage!`);
                  otherPlayer.damage(damage, "basic", player, true, true, true);
                }
                if (player.data.MoveSelected == "Attack+") {
                  this.game.sendAlert(`${player.name} uses attack+!`);
                  let damage = Random.randInt(player.atk + 5, player.atk + 15);
                  otherPlayer.damage(damage, "basic", player, true, true, true);
                  player.data.Charge = 0;
                }
                if (player.data.MoveSelected == "Towntell Takedown") {
                  this.game.sendAlert(
                    `${player.name} uses Towntell Takedown! Their Role is Revealed`
                  );
                  let damage = Random.randInt(player.atk + 10, player.atk + 25);
                  let info = this.game.createInformation(
                    "RevealInfo",
                    player,
                    this.game,
                    player,
                    null,
                    "All"
                  );
                  info.processInfo();
                  info.getInfoRaw();
                  otherPlayer.damage(damage, "basic", player, true, true, true);
                  player.data.Charge = 0;
                }
                if (player.data.MoveSelected == "Mafia Mash") {
                  this.game.sendAlert(`${player.name} uses the Mafia Mash!`);
                  let damage = player.atk * 2 + 10;
                  otherPlayer.damage(damage, "basic", player, true, true, true);
                  player.data.Charge = 0;
                }
                if (player.data.MoveSelected == "Dark Arts") {
                  this.game.sendAlert(`${player.name} uses Dark Arts!`);
                  let damage = Random.randInt(player.atk + 5, player.atk + 15);
                  let heal = otherPlayer.damage(
                    damage,
                    "basic",
                    player,
                    true,
                    true,
                    true
                  );
                  player.data.blood += heal;
                  this.game.sendAlert(`${player.name} gains ${heal}% Blood.`);
                  player.data.Charge = 0;
                }
                if (player.data.MoveSelected == "Triple Attack") {
                  this.game.sendAlert(`${player.name} uses Triple Attack!`);
                  let damage = Random.randInt(player.atk, player.atk + 10);
                  otherPlayer.damage(damage, "basic", player, true, true, true);
                  damage = Random.randInt(player.atk, player.atk + 10);
                  otherPlayer.damage(damage, "basic", player, true, true, true);
                  damage = Random.randInt(player.atk, player.atk + 10);
                  otherPlayer.damage(damage, "basic", player, true, true, true);
                  player.data.Charge = 0;
                }
                if (player.data.MoveSelected == "Typhoon Slash") {
                  this.game.sendAlert(`${player.name} uses Typhoon Slash!`);
                  let damage = Random.randInt(player.atk + 10, player.atk + 20);
                  for (let person of this.game.alivePlayers()) {
                    if (person != player) {
                      person.damage(damage, "basic", player, true, true, true);
                      damage += 2;
                    }
                  }
                  player.data.Charge = 0;
                }
                if (player.data.MoveSelected == "Final Slash") {
                  this.game.sendAlert(
                    `${player.name} uses Final Slash! ${otherPlayer.name}'s Block is removed!`
                  );
                  otherPlayer.data.Block = 0;
                  let damage = Random.randInt(player.atk - 5, player.atk);
                  otherPlayer.damage(damage, "basic", player, true, true, true);
                  player.data.Charge = 0;
                }
              }
              //Buff Actions
              for (let player of duelists) {
                let otherPlayer;
                if (duelists.indexOf(player) == 0) {
                  otherPlayer = duelists[1];
                } else {
                  otherPlayer = duelists[0];
                }
                if (player.data.MoveSelected == "Focus") {
                  let stats = ["atk", "atk", "def", "def", "crit"];
                  let toIncrease = Random.randArrayVal(stats);
                  if (toIncrease == "atk") {
                    this.game.sendAlert(
                      `${player.name} uses Focus! Their Attacking power is increased.`
                    );
                    player.atk += 5;
                  }
                  if (toIncrease == "def") {
                    this.game.sendAlert(
                      `${player.name} uses Focus! Their Defending power is increased.`
                    );
                    player.def += 6;
                  }
                  if (toIncrease == "crit") {
                    this.game.sendAlert(
                      `${player.name} uses Focus! Their Crit Chance is increased.`
                    );
                    player.crit += 1;
                  }
                }
                if (player.data.MoveSelected == "Focus+") {
                  let stats = ["atk", "atk", "def", "def", "crit"];
                  let toIncrease = Random.randArrayVal(stats);
                  if (toIncrease == "atk") {
                    this.game.sendAlert(
                      `${player.name} uses Focus+! Their Attacking power is increased.`
                    );
                    player.atk += 13;
                  }
                  if (toIncrease == "def") {
                    this.game.sendAlert(
                      `${player.name} uses Focus+! Their Blocking power is increased.`
                    );
                    player.def += 16;
                  }
                  if (toIncrease == "crit") {
                    this.game.sendAlert(
                      `${player.name} uses Focus+! Their Crit Chance is increased.`
                    );
                    player.crit += 2;
                  }
                  player.data.Charge = 0;
                }
                if (player.data.MoveSelected == "Tunneling Focus") {
                  this.game.sendAlert(
                    `${player.name} uses Tunneling Focus! Their Crit Chance is increased and they gain blindness.`
                  );
                  player.crit += 4;
                  player.giveEffect("Blind", -1);
                  player.data.Charge = 0;
                }
                if (player.data.MoveSelected == "Blitz Focus") {
                  this.game.sendAlert(
                    `${player.name} uses Blitz Focus! Their Attacking power is increased.`
                  );
                  player.atk += 16;
                  player.data.Charge = 0;
                }
                if (player.data.MoveSelected == "Worship") {
                  this.game.sendAlert(
                    `${player.name} uses Worship! Their Crit Chance, Attacking power, and Blocking power have increased.`
                  );
                  player.crit += 1;
                  player.atk += 8;
                  player.def += 10;
                  player.data.Charge = 0;
                }
                if (player.data.MoveSelected == "Adrenaline") {
                  if (player.data.blood <= 10) {
                    this.game.sendAlert(
                      `${player.name} uses Adrenaline! Their Attacking power has increased.`
                    );
                    player.atk += 50;
                  } else if (player.data.blood <= 30) {
                    this.game.sendAlert(
                      `${player.name} uses Adrenaline! Their Attacking power has increased.`
                    );
                    player.atk += 18;
                  } else if (player.data.blood <= 50) {
                    this.game.sendAlert(
                      `${player.name} uses Adrenaline! Their Attacking power has increased.`
                    );
                    player.atk += 15;
                  } else if (player.data.blood <= 75) {
                    this.game.sendAlert(
                      `${player.name} uses Adrenaline! Their Attacking power has increased.`
                    );
                    player.atk += 12;
                  } else {
                    this.game.sendAlert(
                      `${player.name} uses Adrenaline! Their Blocking power is increased.`
                    );
                    player.def += 18;
                  }
                  player.data.Charge = 0;
                }
                if (player.data.MoveSelected == "Focused Fury") {
                  let stats = [
                    "atk",
                    "atk",
                    "atk",
                    "atk",
                    "def",
                    "crit",
                    "crit",
                    "crit",
                  ];
                  let toIncrease = Random.randArrayVal(stats);
                  if (toIncrease == "atk") {
                    this.game.sendAlert(
                      `${player.name} uses Focused Fury! Their Attacking power is increased and their next Move will be Stronger.`
                    );
                    player.atk += 13;
                  }
                  if (toIncrease == "def") {
                    this.game.sendAlert(
                      `${player.name} uses Focused Fury! Their Blocking power is increased and their next Move will be Stronger.`
                    );
                    player.def += 17;
                  }
                  if (toIncrease == "crit") {
                    this.game.sendAlert(
                      `${player.name} uses Focused Fury! Their Crit Chance is increased and their next Move will be Stronger.`
                    );
                    player.crit += 2;
                  }
                  player.data.Charge = 1;
                }
                if (player.data.MoveSelected == "Charge") {
                  player.data.Charge += 1;
                  this.game.sendAlert(
                    `${player.name} uses Charge! Their next Move will be Stronger.`
                  );
                }
              }
              //Next Turn
              this.game.sendAlert(`Turn ${this.item.Turn + 1}.`);
              for (let player of duelists) {
                let otherPlayer;
                if (duelists.indexOf(player) == 0) {
                  otherPlayer = duelists[1];
                } else {
                  otherPlayer = duelists[0];
                }
                if (player.alive && otherPlayer.alive) {
                  player.data.MoveHasBeenSelected = false;
                  player.data.MoveSelected = null;
                  let blade = player.holdItem(
                    "Blade",
                    player,
                    otherPlayer,
                    player.data.Charge,
                    this.item.Turn + 1
                  );
                  this.game.instantMeeting(blade.meetings, [player]);
                }
              }
            }

            if (
              this.item.Enemy &&
              this.item.Enemy.alive == false &&
              this.actor.alive == true
            ) {
              this.actor.role.data.HasWonBladeDuel = true;
              this.game.sendAlert(`Duel Complete.`);
            } else if (
              this.item.Enemy &&
              this.item.Enemy.alive == true &&
              this.actor.alive == false
            ) {
              this.item.Enemy.role.data.HasWonBladeDuel = true;
              this.game.sendAlert(`Duel Complete.`);
            }
          },
        },
      },
    };
  }
  /*
  run() {
    if (!this.actor.alive || !this.target.alive) return;

    let turn = 1;

    // While the actor or target is alive
    while (this.actor.data.blood > 0 && this.target.data.blood > 0) {
      this.game.queueAlert(`Turn ${turn}`);
      // Shows HP of Actor
      this.game.queueAlert(`${this.actor.name} HP: ${this.actor.data.blood}`);
      // Shows HP of Target
      this.game.queueAlert(`${this.target.name} HP: ${this.target.data.blood}`);

      // Stores their move selection
      let userVote = this.meeting.votes[actor.id];
      let enemyVote = this.meeting.votes[target.id];

      // If neither the user or target voted then return
      if (!userVote || !enemyVote) {
        return;
      }

      // Custom messages for the battle
      if (turn == 1) {
        this.game.queueAlert(`${this.actor.name} unsheathes katana!`);
        this.game.queueAlert(`${this.target.name} eyes glow red.`);
      }

      let wellDoneSent = false;
      let criticalSent = false;
      let deathSent = false;

      let customMessage = "";
      if (
        this.actor.data.blood <= 50 &&
        this.actor.data.blood >= 30 &&
        !wellDoneSent
      ) {
        customMessage = `You have done well so far... But that was just practice!`;
        this.game.queueAlert(customMessage);
        wellDoneSent = true;
      } else if (
        this.actor.data.blood <= 30 &&
        this.actor.data.blood >= 20 &&
        !criticalSent
      ) {
        customMessage = "No more games, to the death!";
        this.game.queueAlert(customMessage);
        criticalSent = true;
      } else if (this.actor.data.blood <= 0 && !deathSent) {
        customMessage = "I can't fall into the hands of an enemy... So I...";
        this.game.queueAlert(customMessage);
        customMessage = "Fulfill a samurai's final duty...";
        this.game.queueAlert(customMessage);
        deathSent = true;
      }

      // Set a state for deciding if an attack has been made
      let attackMade = false;

      // Decide whose action goes first
      let firstMove = Math.floor(Math.random() * 2);

      // User goes first
      if (firstMove === 0) {
        this.performAction(actor, target, userVote, attackMade);
        //Changes the state for attack made incase a defend happens.
        attackMade = true;
        this.performAction(target, actor, enemyVote, attackMade);
      } else {
        // Target goes first
        this.performAction(target, actor, enemyVote, attackMade);

        //Changes the state for attack made incase a defend happens
        attackMade = true;
        this.performAction(actor, target, userVote, attackMade);
      }
      //Increase the turn after actions have been used
      turn++;
    }
    // If the actor or target died, set the winner
    this.actor.winner =
      actor.data.blood > 0 ? this.actor.name : this.target.name;
    this.game.queueAlert(`${this.actor.winner} has won the duel!`);

    // Remove items (if necessary)
    this.actor.item.drop();
    this.target.item.drop();
  }

  performAction(user, enemy, choice, attackMade) {
    let selection = moves.find((move) => move[choice]);
    if (selection) {
      //If an attack hasn't been made assess the messages for defend
      if (!attackMade && choice == "Defend") {
        let defend = moves.find((move) => move.Defend);
        if (defend) {
          let critFailure = " Unable to defend from crits.";
          defend.Defend.action.run.msg += critFailure;
        }
      }
      selection[choice].action.run.call({ user, enemy });
      this.game.queueAlert(selection[choice].msg);
    }
  }
};

//Shows a list of moves samurai and their opponent can choose
let moves = [
  {
    // Basic attack move, deals 3-10 base damage.
    Attack: {
      actionName: "Attack",
      // Can only be done in the day
      states: ["Day"],
      flags: ["voting", "instant", "noVeg"],
      msg: "",
      action: {
        labels: ["attack"],
        run: function () {
          let damage = Math.floor(Math.random() * 4) + 10;
          this.target.data.blood -= damage;
          msg = `${this.actor.name} uses slash. ${this.target.name} loses ${
            damage * (1 + this.actor.crit) * (1 - this.target.def / 100) +
            this.actor.atk
          } HP!`;
          if (this.target.data.blood <= 0) {
            this.target.kill("blood", this.actor);
          }
        },
      },
    },
  },
  {
    // Basic defense increase move stored as a multiplier
    Defend: {
      actionName: "Defend",
      // Can only be done in the day
      states: ["Day"],
      flags: ["voting", "instant", "noVeg"],
      msg: "",
      action: {
        labels: ["defend"],
        run: function () {
          let damageBlocked = Math.floor(Math.random() * 6) * 10;
          this.actor.def += damageBlocked;
          msg = `${this.actor.name} uses defend! Defense is increased.`;
        },
      },
    },
  },
  {
    // Basic attack boost move stored as a multiplier
    Charge: {
      actionName: "Charge",
      // Can only be done in the day
      states: ["Day"],
      flags: ["voting", "instant", "noVeg"],
      msg: "",
      action: {
        labels: ["charge"],
        run: function () {
          this.actor.crit += 0.25;
          msg = `${this.actor.name} uses charge! Attack power increased.`;
        },
      },
    },
    
  },
];
*/
};
