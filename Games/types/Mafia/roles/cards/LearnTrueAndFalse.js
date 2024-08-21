const Card = require("../../Card");
const Random = require("../../../../../lib/Random");
const { PRIORITY_DAY_DEFAULT } = require("../../const/Priority");
const { PRIORITY_KILL_DEFAULT } = require("../../const/Priority");

module.exports = class LearnTrueAndFalse extends Card {
  constructor(role) {
    super(role);

    role.openedDoor = false;

    this.meetings = {
      "Get Info": {
        states: ["Day"],
        flags: ["voting", "instant"],
        inputType: "boolean",
        action: {
          priority: PRIORITY_DAY_DEFAULT,
          run: function () {
            if (this.target == "No") return;

            let infoTypes = [true, false];

            if (this.actor.hasEffect("FalseMode")) {
              infoTypes = [false, false];
            }

            let info = [0, 0];

            let alivePlayers = this.game.alivePlayers();
            let roles = this.game.PossibleRoles.filter((r) => r);
            let players = this.game.players.filter((p) => p.role);
            let currentRoles = [];

            for (let x = 0; x < players.length; x++) {
              currentRoles.push(players[x].role);
            }
            for (let y = 0; y < currentRoles.length; y++) {
              roles = roles.filter(
                (r) => r.split(":")[0] != currentRoles[y].name
              );
            }
            let x = 0;
            while (x < infoTypes.length) {
              let chosenInfo = Random.randInt(0, 5);
              let role;
              let playerCheck;
              let rightIdx;
              let leftIdx;
              //x++;

              switch (chosenInfo) {
                case 0:
                  // Role is in Play
                  if (roles.length <= 0) break;
                  if (infoTypes[x]) {
                    role = Random.randArrayVal(currentRoles).name;
                  } else {
                    role = Random.randArrayVal(roles).split(":")[0];
                  }

                  info[x] = `(${role} is Currently in the Game)`;
                  x++;
                  break;
                case 1:
                  // Player neighbors Role
                  playerCheck = Random.randArrayVal(alivePlayers);
                  let index = alivePlayers.indexOf(playerCheck);
                  rightIdx = (index + 1) % alivePlayers.length;
                  leftIdx =
                    (index - 1 + alivePlayers.length) % alivePlayers.length;
                  let neighborRoles = [
                    alivePlayers[rightIdx].role,
                    alivePlayers[leftIdx].role,
                  ];
                  let wrongPlayers = alivePlayers.filter(
                    (p) => p.role.name != neighborRoles[0].name
                  );
                  wrongPlayers = wrongPlayers.filter(
                    (p) => p.role.name != neighborRoles[1].name
                  );

                  if (wrongPlayers.length <= 0) break;

                  if (infoTypes[x]) {
                    role = Random.randArrayVal(neighborRoles).name;
                  } else {
                    role = Random.randArrayVal(wrongPlayers).role.name;
                  }

                  info[
                    x
                  ] = `(${playerCheck.name} is Currently neighbors with ${role} )`;
                  x++;
                  break;

                case 2:
                  // Player Distance to nearest Evil
                  if (
                    alivePlayers.filter(
                      (p) =>
                        p.role.alignment == "Cult" ||
                        p.role.alignment == "Mafia"
                    ).length <= 0
                  )
                    break;
                  if (alivePlayers.length <= 3) break;
                  playerCheck = Random.randArrayVal(
                    alivePlayers.filter(
                      (p) =>
                        p.role.alignment != "Cult" &&
                        p.role.alignment != "Mafia"
                    )
                  );
                  let indexOfTarget = alivePlayers.indexOf(playerCheck);
                  //rightIdx = index+1 % alivePlayers.length;
                  //leftIdx = index-1 % alive.length;
                  let leftAlign;
                  let rightAlign;
                  let distance = 0;
                  let found = false;

                  for (let y = 0; y < alivePlayers.length && !found; y++) {
                    leftIdx =
                      (indexOfTarget - distance - 1 + alivePlayers.length) %
                      alivePlayers.length;
                    rightIdx =
                      (indexOfTarget + distance + 1) % alivePlayers.length;
                    leftAlign = alivePlayers[leftIdx].role.alignment;
                    rightAlign = alivePlayers[rightIdx].role.alignment;

                    if (rightAlign == "Cult" || rightAlign == "Mafia") {
                      found = true;
                    } else if (leftAlign == "Cult" || leftAlign == "Mafia") {
                      found = true;
                    } else {
                      distance = y;
                    }
                  }

                  if (!infoTypes[x]) {
                    if (distance > 0) {
                      distance = distance - 1;
                    } else {
                      distance = distance + 1;
                    }
                  }

                  info[
                    x
                  ] = `(Their is ${distance} players beetween ${playerCheck.name} and an evil player )`;
                  if (distance == 0) {
                    info[x] = `(${playerCheck.name} neighbors an evil player )`;
                  }
                  x++;
                  break;

                case 3:
                  // Dead Evils
                  let playersDead = this.game.deadPlayers();
                  var evilPlayers = playersDead.filter(
                    (p) =>
                      p.role.alignment == "Cult" || p.role.alignment == "Mafia"
                  );
                  let evilCount = evilPlayers.length;
                  if (playersDead.length <= 1) break;

                  if (!infoTypes[x]) {
                    if (evilCount == 0) evilCount = 1;
                    else evilCount = evilCount - 1;
                  }

                  info[x] = `(${evilCount} Evil Players are dead)`;
                  x = x + 1;
                  break;

                case 4:
                  // Calulated Famine Death
                  if (this.game.famineStarted != true) break;
                  let deathCounter = 0;
                  let safe = false;
                  for (let player of alivePlayers) {
                    safe = false;
                    if (player.getImmunity("famine")) safe = true;
                    // food items are eaten in this order
                    let foodTypes = ["Food", "Bread", "Orange"];
                    for (let food of foodTypes) {
                      let foodItems = player.getItems(food);
                      for (let item of foodItems) {
                        if (!item.broken) {
                          safe = true;
                        }
                      }
                    }
                    if (!safe) {
                      deathCounter++;
                    }
                  }

                  if (!infoTypes[x]) {
                    if (deathCounter > 0) {
                      deathCounter = 0;
                    } else {
                      deathCounter = deathCounter + 2;
                    }
                  }

                  info[
                    x
                  ] = `(${deathCounter} Players have no food for the famine.)`;
                  x++;
                  break;

                case 5:
                  // Players have same alignment
                  playerCheck = Random.randArrayVal(alivePlayers);
                  let playersNotTarget = alivePlayers.filter(
                    (p) => p != playerCheck
                  );
                  let playerCheckTwo = Random.randArrayVal(playersNotTarget);
                  let relation;
                  if (infoTypes[x]) {
                    if (
                      playerCheck.role.alignment ==
                      playerCheckTwo.role.alignment
                    ) {
                      relation = "Same";
                    } else {
                      relation = "Diffrent";
                    }
                  } else {
                    if (
                      playerCheck.role.alignment ==
                      playerCheckTwo.role.alignment
                    ) {
                      relation = "Diffrent";
                    } else {
                      relation = "Same";
                    }
                  }

                  info[
                    x
                  ] = `(${playerCheck.name} and ${playerCheckTwo.name} have the ${relation} Alignments)`;
                  x = x + 1;
                  break;
              }
            }
            let ranInfo = Random.randomizeArray(info);

            this.actor.queueAlert(
              `You learn that ${ranInfo[0]} OR ${ranInfo[1]} is True!`
            );
          },
        },
      },
    };
  }
};
