const Card = require("../../Card");
const {
  PRIORITY_WIN_CHECK_DEFAULT,
  PRIORITY_SUNSET_DEFAULT,
  PRIORITY_DAY_DEFAULT,
} = require("../../const/Priority");
const {
  EVIL_FACTIONS,
  NOT_EVIL_FACTIONS,
  CULT_FACTIONS,
  MAFIA_FACTIONS,
  FACTION_LEARN_TEAM,
  FACTION_WIN_WITH_MAJORITY,
  FACTION_WITH_MEETING,
  FACTION_KILL,
} = require("../../const/FactionList");

module.exports = class WinWithFaction extends Card {
  constructor(role) {
    super(role);

    if (role.isExtraRole == true) {
      return;
    }

    this.winCheck = {
      priority: PRIORITY_WIN_CHECK_DEFAULT,
      check: function (counts, winners, aliveCount) {
        function factionWin(role) {
          winners.addPlayer(role.player, role.player.faction);
        }

        //Const
        const ONE_NIGHT = this.game.IsBloodMoon == true;
        const CULT_IN_GAME =
          this.game.players.filter((p) => CULT_FACTIONS.includes(p.faction))
            .length > 0;
        const MAFIA_IN_GAME =
          this.game.players.filter((p) => MAFIA_FACTIONS.includes(p.faction))
            .length > 0;
        const SUPERHERO_IN_GAME =
          this.game.players.filter((p) => p.role.name == "Superhero").length >
          0;

        //Const
        const seersInGame = this.game.players.filter(
          (p) => p.role.name == "Seer"
        );
        const poetsInGame = this.game.players.filter(
          (p) => p.role.name == "Poet"
        );

        const MolesInGame = this.game.players.filter((p) =>
          p.hasItem("IsTheMole")
        );
        let factionCount = this.game.players.filter(
          (p) =>
            p.faction == this.player.faction &&
            p.alive &&
            this.game.getRoleAlignment(p.role.name) != "Independent"
        ).length;
        if (
          MAFIA_FACTIONS.includes(this.player.faction) ||
          CULT_FACTIONS.includes(this.player.faction)
        ) {
          const aliveMastermind = this.game
            .alivePlayers()
            .filter((p) => p.role.name === "Mastermind");
          factionCount += aliveMastermind.length;
        }
        let lunatics = this.game.players.filter((p) =>
          p.hasItem("IsTheTelevangelist")
        );

        const hasMajority = factionCount >= aliveCount / 2 && aliveCount > 0;
        const assassinInGame = this.game
          .alivePlayers()
          .filter((p) => p.hasEffect("AssassinEffect"));

        //Special Win Cons
        //MagusWin
        if (this.player.faction == "Village") {
          const magusInGameWin = this.game.players.filter(
            (p) => p.role.name == "Magus"
          );
          if (
            magusInGameWin.length > 0 &&
            this.game.MagusGameDeclared == true
          ) {
            factionWin(this);
            return;
          }
        }

        // win by guessing Mole
        if (EVIL_FACTIONS.includes(this.player.faction)) {
          if (this.game.hasGuessedMole == true) {
            factionWin(this);
            return;
          }
        }

        //Win Blocking
        //Dead President
        if (this.player.faction == "Village") {
          if (this.killedPresident) {
            return;
          }
        }
        //Guessed Seer Conditional
        if (this.player.faction == "Village") {
          if (seersInGame.length > 0) {
            for (let x = 0; x < EVIL_FACTIONS.length; x++) {
              if (
                seersInGame.length ==
                this.game.guessedSeers[EVIL_FACTIONS[x]]?.length
              ) {
                //seers have been guessed, village cannot win
                return;
              }
            }
          }
        }
        //Guessed Poet Conditional
        if (this.player.faction == "Cult") {
          if (poetsInGame.length > 0) {
            for (let x = 0; x < EVIL_FACTIONS.length; x++) {
              if (
                poetsInGame.length ==
                this.game.guessedPoets[EVIL_FACTIONS[x]]?.length
              ) {
                //poets have been guessed, cult cannot win
                return;
              }
            }
          }
        }
        //Guessed Mole Conditional
        if (this.player.faction == "Village") {
          if (MolesInGame.length > 0 && this.game.hasGuessedMole) {
            //Moles have been guessed, village cannot win
            return;
          }
        }
        //Magus conditional
        if (this.player.faction == "Village") {
          const magusInGame = this.game.players.filter(
            (p) => p.role.name == "Magus" && !p.role.data.MagusWin
          );
          const mafiaCultInGame = this.game.players.filter(
            (p) =>
              (MAFIA_FACTIONS.includes(p.faction) ||
                CULT_FACTIONS.includes(p.faction)) &&
              p.role.name != "Magus"
          );
          if (magusInGame.length > 0) {
            // Magus in Game Town Can't Win
            return;
          }
        }
        //Graveyard conditional
        if (this.player.faction == "Village" && !ONE_NIGHT) {
          const deadEvilPoltergeist = this.game
            .deadPlayers()
            .filter(
              (p) =>
                p.role.data.CountForMajWhenDead &&
                !p.exorcised &&
                EVIL_FACTIONS.includes(p.faction)
            );
          if (deadEvilPoltergeist.length > 0) {
            // Poltergeist in Graveyard Town Can't Win
            return;
          }
        }

        //soldier conditional
        if (this.player.faction != "Village" && !ONE_NIGHT) {
          const soldiersInGame = this.game.players.filter((p) =>
            p.hasEffect("SoldierEffect")
          );

          if (soldiersInGame.length > 0) {
            if (soldiersInGame.length == aliveCount / 2 && aliveCount > 0) {
              // soldiers are present, mafia cannot win
              return;
            }
          }
        }
        //Admiral conditional
        if (this.player.faction != "Village" && !ONE_NIGHT) {
          const AdmiralsInGame = this.game.players.filter(
            (p) => p.role.name == "Admiral" && p.alive
          );

          if (AdmiralsInGame.length > 0) {
            // soldiers are present, mafia cannot win
            return;
          }
        }
        if (this.player.faction == "Village" && !ONE_NIGHT) {
          const AdmiralsInGame = this.game.players.filter(
            (p) => p.role.name == "Admiral" && p.alive
          );

          if (AdmiralsInGame.length > 0) {
            for (let person of this.game.players) {
              if (person.hasItem("TreasureChest") && person.alive) {
                return;
              }
            }
          }
        }
        //Assassin conditional
        if (
          MAFIA_FACTIONS.includes(this.player.faction) ||
          this.player.faction == "Village"
        ) {
          if (assassinInGame.length > 0) {
            //if assassin is not condemned, Mafia will not win by Majority and Village Will Not Win by killing all mafia.
            return;
          }
        }

        //Zealot conditional
        if (this.player.faction == "Village") {
          let aliveZealots2 = this.game.players.filter(
            (p) =>
              p.role.name === "Zealot" &&
              this.player.role.data.ZealotCondemn &&
              p.hasAbility(["Win-Con"])
          );
          if (aliveZealots2.length > 0) {
            return;
          }
        }

        //Vampire conditional
        if (EVIL_FACTIONS.includes(this.player.faction) && !ONE_NIGHT) {
          let vampires = this.game.players.filter(
            (p) => p.role.name == "Vampire" && p.faction == this.player.faction
          );
          if (vampires.length >= 2 && counts["Village"] > 1) {
            return;
          }
        }
        //Demonic Modifier Cult
        if (CULT_FACTIONS.includes(this.player.faction) && !ONE_NIGHT) {
          let demonicPlayers = this.game
            .alivePlayers()
            .filter(
              (p) =>
                p.isDemonic(true) &&
                !(
                  p.hasItem("IsTheTelevangelist") ||
                  p.role.name == "Televangelist"
                )
            );
          if (demonicPlayers.length > 0) {
            let demonicAndCult = this.game
              .alivePlayers()
              .filter(
                (p) => !p.isDemonic(true) && p.faction != this.player.faction
              );
            if (
              demonicPlayers.length > 0 &&
              this.game.alivePlayers().length <= 2
            ) {
              factionWin(this);
              return;
            } else if (demonicAndCult.length > 0) {
              return;
            } else if (demonicAndCult.length <= 1) {
              factionWin(this);
              return;
            }
          }
        }
        //Demonic Modifier Village
        if (this.player.faction == "Village" && !ONE_NIGHT) {
          let demonicPlayers = this.game
            .alivePlayers()
            .filter(
              (p) =>
                p.isDemonic(true) &&
                !(
                  p.hasItem("IsTheTelevangelist") ||
                  p.role.name == "Televangelist"
                )
            );
          let deadCult = this.game
            .deadPlayers()
            .filter((p) => CULT_FACTIONS.includes(p.faction));
          if (demonicPlayers.length > 0 && deadCult.length > 0) {
            return;
          }
        }
        //Win Cons

        //One Night Win-Cons
        if (this.game.hasBeenBloodMoonDay == true) {
          //Cult
          if (CULT_FACTIONS.includes(this.player.faction) && ONE_NIGHT) {
            var deadCult = this.game.BloodMoonKills.filter(
              (p) => p.faction == this.player.faction
            );
            if (deadCult.length <= 0 || this.game.deadPlayers().length <= 0) {
              factionWin(this);
              return;
            }
          }

          //Mafia
          if (MAFIA_FACTIONS.includes(this.player.faction) && ONE_NIGHT) {
            var deadMafia = this.game.BloodMoonKills.filter(
              (p) => p.faction == this.player.faction
            );
            if (deadMafia.length <= 0 || this.game.deadPlayers().length <= 0) {
              factionWin(this);
              return;
            }
          }

          //Village
          if (this.player.faction == "Village" && ONE_NIGHT) {
            var deadMafia = this.game.BloodMoonKills.filter((p) =>
              MAFIA_FACTIONS.includes(p.faction)
            );
            var deadCult = this.game.BloodMoonKills.filter((p) =>
              CULT_FACTIONS.includes(p.faction)
            );
            var deadThird = this.game.BloodMoonKills.filter(
              (p) => this.game.getRoleAlignment(p.role.name) == "Independent"
            );
            var deadVillage = this.game.BloodMoonKills.filter(
              (p) => p.faction == "Village"
            );
            if (
              CULT_IN_GAME == true &&
              (deadCult.length <= 0 || this.game.deadPlayers().length <= 0)
            )
              return;
            if (
              MAFIA_IN_GAME == true &&
              (deadMafia.length <= 0 || this.game.deadPlayers().length <= 0)
            )
              return;
            if (
              SUPERHERO_IN_GAME == true &&
              (deadThird.length <= 0 || this.game.deadPlayers().length <= 0)
            )
              return;
            if (
              !MAFIA_IN_GAME &&
              !CULT_IN_GAME &&
              !SUPERHERO_IN_GAME &&
              deadVillage.length > 0
            )
              return;
            factionWin(this);
            return;
          }
        }
        //Hostile blocker
        if (
          EVIL_FACTIONS.includes(this.player.faction) &&
          this.game.isHostileVsMafia()
        ) {
          let hostile3rds = this.game
            .alivePlayers()
            .filter(
              (p) =>
                p.faction == "Independent" &&
                this.game.getRoleTags(p.role.name).includes("Hostile") &&
                p.role.name != "Mastermind"
            );
          if (hostile3rds.length > 0) {
            return;
          }
        }
        //Competing Evil Factions
        if (
          EVIL_FACTIONS.includes(this.player.faction) &&
          this.game.isCultVsMafia()
        ) {
          let hostileFactions = this.game
            .alivePlayers()
            .filter(
              (p) =>
                p.faction != this.player.faction &&
                p.faction != "Evil" &&
                EVIL_FACTIONS.includes(p.faction)
            );
          if (hostileFactions.length > 0) {
            return;
          }
        }

        //Win with Dead Poltergeist
        if (EVIL_FACTIONS.includes(this.player.faction) && !ONE_NIGHT) {
          let factionCountWithDead = this.game.players.filter(
            (p) =>
              p.faction == this.player.faction &&
              (p.alive || (p.role.data.CountForMajWhenDead && !p.exorcised)) &&
              this.game.getRoleAlignment(p.role.name) != "Independent"
          ).length;
          const deadPoltergeist = this.game
            .deadPlayers()
            .filter(
              (p) =>
                p.role.data.CountForMajWhenDead &&
                !p.exorcised &&
                p.faction == this.player.faction
            );
          if (deadPoltergeist.length > 0) {
            if (aliveCount <= factionCountWithDead) {
              factionWin(this);
              return;
            }
          }
        }

        // Win with Traitors
        if (MAFIA_FACTIONS.includes(this.player.faction)) {
          const numTraitorsAlive = this.game.players.filter(
            (p) => p.alive && p.role.name == "Traitor"
          ).length;
          if (aliveCount > 0 && factionCount + numTraitorsAlive == aliveCount) {
            factionWin(this);
            return;
          }
        }
        // win by majority
        if (
          FACTION_WIN_WITH_MAJORITY.includes(this.player.faction) &&
          !ONE_NIGHT
        ) {
          if (hasMajority) {
            factionWin(this);
            return;
          }
        }

        //Village Normal Win
        if (this.player.faction == "Village" && !ONE_NIGHT) {
          let VillagePlayers = this.game
            .alivePlayers()
            .filter(
              (p) =>
                p.faction == "Village" ||
                (p.faction == "Independent" &&
                  !this.game.getRoleTags(p.role.name).includes("Hostile"))
            );
          if (
            VillagePlayers.length == aliveCount &&
            aliveCount > 0 &&
            this.game
              .alivePlayers()
              .filter(
                (p) =>
                  EVIL_FACTIONS.includes(p.faction) &&
                  this.game.getRoleAlignment(p.role.name) != "Independent"
              ).length <= 0
          ) {
            factionWin(this);
            return;
          }
        }
        //Village Soldier Win
        if (this.player.faction == "Village") {
          if (
            this.game.alivePlayers().filter((p) => p.hasEffect("SoldierEffect"))
              .length >=
              aliveCount / 2 &&
            aliveCount > 0
          ) {
            factionWin(this);
            return;
          }
        }
      },
    };

    this.listeners = {
      roleAssigned: function (player) {
        if (player !== this.player) return;
        for (let z = 0; z < this.game.PossibleRoles.length; z++) {
          if (
            this.game
              .getRoleTags(this.game.PossibleRoles[z].split(":")[0])
              .includes("Independent Faction")
          ) {
            this.game.IndependentFaction = true;
          }
        }

        if (
          this.game.IndependentFaction == true &&
          this.game.IsBloodMoon == true
        ) {
          this.player.queueAlert(
            "If a Superhero Spawns, You will need to kill an Independent role in order to win in addition to a Mafia/Cult."
          );
        }

        if (!this.game.guessedSeers) {
          this.game.guessedSeers = {};
        }
        this.game.guessedSeers[this.player.faction] = [];

        if (!this.game.guessedPoets) {
          this.game.guessedPoets = {};
        }
        this.game.guessedPoets[this.player.faction] = [];

        if (
          !FACTION_LEARN_TEAM.includes(this.player.faction) &&
          !this.player.hasItem("IsTheTelevangelist")
        )
          return;

        if (this.oblivious["Faction"]) return;

        const assassinInGame = this.game
          .alivePlayers()
          .filter((p) => p.hasEffect("AssassinEffect"));
        if (assassinInGame.length > 0) return;

        if (this.game.started == true && this.game.isHiddenConverts() == true) {
          return;
        }

        if (this.player.hasItem("IsTheTelevangelist")) {
          this.player.role.appearance.reveal = "Televangelist";
          for (let player of this.game.players) {
            if (
              player.faction === this.player.factionFake &&
              player !== this.player &&
              player.role.name !== "Politician" &&
              player.role.name !== "Hitchhiker" &&
              !player.role.oblivious["self"] &&
              !player.hasItem("IsTheTelevangelist")
            ) {
              this.revealToPlayer(player);
            }
          }
          return;
        }

        for (let player of this.game.players) {
          if (
            player.faction === this.player.faction &&
            player !== this.player &&
            player.role.name !== "Politician" &&
            player.role.name !== "Hitchhiker" &&
            !player.role.oblivious["self"] &&
            !player.hasItem("IsTheTelevangelist")
          ) {
            this.revealToPlayer(player);
          } else if (
            player.hasItem("IsTheTelevangelist") &&
            !this.game
              .getRoleTags(this.player.role.name)
              .join("")
              .includes("Endangered") &&
            !this.game
              .getRoleTags(
                `${this.player.role.name}:${this.player.role.modifier}`
              )
              .join("")
              .includes("Demonic") &&
            !this.game
              .getRoleTags(this.player.role.name)
              .join("")
              .includes("Kills Cultist") &&
            player.factionFake === this.player.faction
          ) {
            this.revealToPlayer(player);
          }
        }
      },
      death: function (player, killer, deathType) {
        if (player.hasEffect("PresidentEffect")) {
          this.killedPresident = true;
        }
        if (player.hasEffect("AssassinEffect")) {
          this.killedAssassin = true;
        }

        if (this.game.IsBloodMoon == true) {
          if (this.game.BloodMoonKills == null) {
            this.game.BloodMoonKills = [];
          }
          this.game.BloodMoonKills.push(player);
        }
      },
      state: function (stateInfo) {
        if (stateInfo.name.match(/Dawn/) || stateInfo.name.match(/Dusk/)) {
          for (let z = 0; z < this.game.PossibleRoles.length; z++) {
            if (
              this.game
                .getRoleTags(this.game.PossibleRoles[z].split(":")[0])
                .includes("Independent Faction")
            ) {
              this.game.IndependentFaction = true;
            }
          }
        }
        if (!this.player.alive) {
          return;
        }
        if (
          this.game.getRoleAlignment(this.player.role.name) !=
            this.player.faction &&
          !this.player.hasItem("IsTheTelevangelist")
        ) {
          if (this.player.faction == "Evil") {
            this.player.queueAlert(
              `You are ${this.player.faction} Aligned, You will win if Village loses!`
            );
          } else {
            this.player.queueAlert(
              `You are ${this.player.faction} Aligned, You will win with ${this.player.faction}!`
            );
          }
        }
      },
    };

    // seer and poet meeting and state mods
    this.meetings = {
      "Guess Seer": {
        states: ["Dusk"],
        flags: ["voting"],
        targets: { include: ["alive", "dead"], exclude: ["self"] },
        shouldMeet: function () {
          if (
            this.game.players.filter((p) => p.role.name == "Seer").length <= 0
          ) {
            return false;
          }

          if (NOT_EVIL_FACTIONS.includes(this.player.faction)) {
            return false;
          }

          for (const action of this.game.actions[0]) {
            if (action.hasLabel("condemn") && action.target == this.player) {
              return true;
            }
          }

          return false;
        },
        action: {
          labels: ["kill"],
          priority: PRIORITY_SUNSET_DEFAULT,
          run: function () {
            if (this.target.role.name !== "Seer") {
              return;
            }
            if (!this.target.hasAbility(["Win-Con", "WhenDead"])) {
              return;
            }

            this.game.guessedSeers[this.actor.faction].push(this.target);
            this.target.kill("condemnRevenge", this.actor);
          },
        },
      },
      "Guess Poet": {
        states: ["Dusk"],
        flags: ["voting"],
        targets: { include: ["alive", "dead"], exclude: ["self"] },
        shouldMeet: function () {
          if (
            this.game.players.filter((p) => p.role.name == "Poet").length <= 0
          ) {
            return false;
          }

          if (NOT_EVIL_FACTIONS.includes(this.player.faction)) {
            return true;
          }

          for (const action of this.game.actions[0]) {
            if (action.hasLabel("condemn") && action.target == this.player) {
              return true;
            }
          }

          return false;
        },
        action: {
          labels: ["kill"],
          priority: PRIORITY_SUNSET_DEFAULT,
          run: function () {
            if (this.target.role.name !== "Poet") {
              return;
            }
            if (!this.target.hasAbility(["Win-Con", "WhenDead"])) {
              return;
            }

            this.game.guessedPoets[this.actor.faction].push(this.target);
            this.target.kill("condemnRevenge", this.actor);
          },
        },
      },
      "Guess the Poet After Ghost Win": {
        states: ["Epilogue"],
        flags: ["group", "voting", "mustAct"],
        targets: { include: ["alive", "dead"], exclude: [] },
        whileAlive: false,
        whileDead: true,
        action: {
          run: function () {
            if (!this.game.poetGuessPhaseActive) {
              return;
            }

            // Mark that the poet guess phase is completed
            this.game.poetGuessPhaseCompleted = true;

            // Check if the guessed player is actually the Poet
            if (this.target.role.name === "Poet") {
              // Village guessed correctly - Ghosts and Poet lose
              this.game.queueAlert(
                `The Village has correctly identified ${this.target.name} as the Poet!`
              );
              this.game.VillageFailedToGuessPoet = false;
              this.game.VillageGuessedThePoet = true
            } else {
              // Village guessed incorrectly - Cult wins as originally planned
              this.game.queueAlert(
                `The Village incorrectly identified ${this.target.name} as the Poet!`
              );
              this.game.VillageFailedToGuessPoet = true;

              // End the game with Cult winners
              //this.game.endGame(winners);
            }
          },
        },
        shouldMeet: function () {
          // Only meet if the poet guess phase is active
          return this.game.poetGuessPhaseActive === true;
        },
      },
    };
  }
};
