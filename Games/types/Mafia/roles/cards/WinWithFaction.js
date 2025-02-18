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

    this.actions = [
      {
        priority: PRIORITY_DAY_DEFAULT + 20,
        run: function () {
          const CULT_IN_GAME =
            this.game.players.filter((p) => CULT_FACTIONS.includes(p.faction))
              .length > 0;
          const MAFIA_IN_GAME =
            this.game.players.filter((p) => MAFIA_FACTIONS.includes(p.faction))
              .length > 0;
          const SUPERHERO_IN_GAME =
            this.game.players.filter((p) => p.role.name == "Superhero").length >
            0;
          //if (!this.actor.alive) return;
          //if (!this.game.isOneNightMode()) return;
          if (
            this.game.getStateName() == "Day" ||
            (this.game.getStateName() == "Dusk" && this.game.hasBeenNight)
          ) {
            this.game.hasBeenDay = true;
            return;
          }
          if (
            this.game.getStateName() == "Night" ||
            this.game.getStateName() == "Dawn"
          ) {
            if (this.game.isOneNightMode() && MAFIA_IN_GAME && CULT_IN_GAME) {
              for (let player of this.game.players) {
                player.holdItem("ExtraCondemn", "Extra Condemn");
              }
            }
            if (
              this.game.isOneNightMode() &&
              (MAFIA_IN_GAME || CULT_IN_GAME) &&
              SUPERHERO_IN_GAME
            ) {
              for (let player of this.game.players) {
                player.holdItem("ExtraCondemn", "Bonus Condemn");
              }
            }
            this.game.hasBeenNight = true;
          }
        },
      },
    ];

    this.winCheck = {
      priority: PRIORITY_WIN_CHECK_DEFAULT,
      check: function (counts, winners, aliveCount) {
        function factionWin(role) {
          winners.addPlayer(role.player, role.player.faction);
        }

        //Const
        const ONE_NIGHT = this.game.isOneNightMode();
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
        const assassinInGame = this.game.players.filter(
          (p) => p.role.name === "Assassin"
        );

        //Special Win Cons
        // win by Zealot
        const aliveZealots = this.game
          .alivePlayers()
          .filter(
            (p) =>
              p.role.name === "Zealot" &&
              p.role.data.ZealotWin &&
              p.faction == this.player.faction
          );
        if (aliveZealots.length > 0) {
          factionWin(this);
          return;
        }
        // win by Changeling
        const aliveChangelings = this.game
          .alivePlayers()
          .filter(
            (p) =>
              p.role.name === "Changeling" &&
              p.role.data.twincondemned &&
              p.faction == this.player.faction
          );
        if (aliveChangelings.length > 0) {
          factionWin(this);
          return;
        }
        //Mayor Win
        const aliveMayors = this.game
          .alivePlayers()
          .filter(
            (p) =>
              p.role.name === "Mayor" &&
              p.role.data.MayorWin &&
              p.faction == this.player.faction
          );
        if (aliveMayors.length > 0 && aliveCount == 3) {
          if (
            this.game.getStateName() == "Day" &&
            aliveMayors[0].role.data.MayorWin
          ) {
            factionWin(this);
            return;
          }
        }

        //Win with Nyarlathotep NC
        const enemyMayors = this.game
          .alivePlayers()
          .filter(
            (p) =>
              p.role.name === "Mayor" &&
              p.role.data.MayorWin &&
              p.faction != this.player.faction
          );
        const aliveNyarlathotep = this.game
          .alivePlayers()
          .filter(
            (p) =>
              p.role.name === "Nyarlathotep" &&
              p.role.data.NyarlathotepWin &&
              p.faction == this.player.faction
          );
        if (aliveNyarlathotep.length > 0 && enemyMayors.length <= 0) {
          if (
            this.game.getStateName() == "Day" &&
            aliveNyarlathotep[0].role.data.NyarlathotepWin
          ) {
            factionWin(this);
            return;
          }
        }

        // win by killing president
        if (EVIL_FACTIONS.includes(this.player.faction)) {
          if (this.killedPresident) {
            factionWin(this);
            return;
          }
        }
        // win by killing senators
        if (EVIL_FACTIONS.includes(this.player.faction)) {
          var hasSenators = false;
          var senatorCount = 0;
          for (let p of this.game.players) {
            if (p.role.name == "Senator") {
              hasSenators = true;
              senatorCount += p.alive ? 1 : -1;
            }
          }

          if (hasSenators && senatorCount <= 0) {
            factionWin(this);
            return;
          }
        }
        // win by guessing seer
        if (EVIL_FACTIONS.includes(this.player.faction)) {
          if (
            seersInGame.length > 0 &&
            seersInGame.length ==
              this.game.guessedSeers[this.player.faction].length
          ) {
            factionWin(this);
            return;
          }
        }

        //win by killing Assassin
        if (this.player.faction == "Village") {
          var hasSenators = false;
          var senatorCount = 0;
          for (let p of this.game.players) {
            if (p.role.name == "Senator") {
              hasSenators = true;
              senatorCount += p.alive ? 1 : -1;
            }
          }
          if (hasSenators && senatorCount <= 0) return;
          if (this.killedAssassin) {
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
          if (magusInGame.length > 0 && mafiaCultInGame.length <= 0) {
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
          const soldiersInGame = this.game.players.filter(
            (p) => p.role.name == "Soldier" && p.faction == "Village" && p.alive
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
              if (person.hasItem("TreasureChest")) {
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
        /*
        //Shoggoth conditional
        if (CULT_FACTIONS.includes(this.player.faction) && !ONE_NIGHT) {
          const ShoggothInGame = this.game
            .alivePlayers()
            .filter(
              (p) =>
                p.role.name == "Shoggoth" &&
                !p.role.revived &&
                p.role.alignment == this.player.faction
            );

          if (ShoggothInGame.length > 0) {
            // shoggoth hasn't Revived, cult cannot win
            return;
          }
        }
        */
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
        if (this.game.hasBeenDay == true) {
          //Cult
          if (CULT_FACTIONS.includes(this.player.faction) && ONE_NIGHT) {
            var deadCult = this.game
              .deadPlayers()
              .filter((p) => p.faction == this.player.faction);
            var deadThird = this.game
              .deadPlayers()
              .filter(
                (p) => this.game.getRoleAlignment(p.role.name) == "Independent"
              );
            var deadMafia = this.game
              .deadPlayers()
              .filter((p) => MAFIA_FACTIONS.includes(p.faction));
            if (
              (MAFIA_IN_GAME && deadMafia.length <= 0) ||
              this.game.deadPlayers().length <= 0
            )
              return;
            if (
              (SUPERHERO_IN_GAME && deadThird.length <= 0) ||
              this.game.deadPlayers().length <= 0
            )
              return;
            if (deadCult.length <= 0 || this.game.deadPlayers().length <= 0) {
              factionWin(this);
              return;
            }
          }

          //Mafia
          if (MAFIA_FACTIONS.includes(this.player.faction) && ONE_NIGHT) {
            var deadMafia = this.game
              .deadPlayers()
              .filter((p) => p.faction == this.player.faction);
            var deadThird = this.game
              .deadPlayers()
              .filter(
                (p) => this.game.getRoleAlignment(p.role.name) == "Independent"
              );
            var deadCult = this.game
              .deadPlayers()
              .filter((p) => CULT_FACTIONS.includes(p.faction));
            if (
              (CULT_IN_GAME && deadCult.length <= 0) ||
              this.game.deadPlayers().length <= 0
            )
              return;
            if (
              SUPERHERO_IN_GAME == true &&
              (deadThird.length <= 0 || this.game.deadPlayers().length <= 0)
            )
              return;
            if (deadMafia.length <= 0 || this.game.deadPlayers().length <= 0) {
              factionWin(this);
              return;
            }
          }

          //Village
          if (this.player.faction == "Village" && ONE_NIGHT) {
            var deadMafia = this.game
              .deadPlayers()
              .filter((p) => MAFIA_FACTIONS.includes(p.faction));
            var deadCult = this.game
              .deadPlayers()
              .filter((p) => CULT_FACTIONS.includes(p.faction));
            var deadThird = this.game
              .deadPlayers()
              .filter(
                (p) => this.game.getRoleAlignment(p.role.name) == "Independent"
              );
            var deadVillage = this.game
              .deadPlayers()
              .filter((p) => p.faction == "Village");
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
          if (factionCount + numTraitorsAlive == aliveCount) {
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
          if (
            counts.Village == aliveCount &&
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
            this.game
              .alivePlayers()
              .filter(
                (p) => p.role.name === "Soldier" && p.faction == "Village"
              ).length >=
              aliveCount / 2 &&
            aliveCount > 0
          ) {
            factionWin(this);
            return;
          }
        }
        /*
        //Village Shoggoth Win
        if (this.player.faction == "Village" && !ONE_NIGHT) {
          if (
            this.game
              .alivePlayers()
              .filter(
                (p) =>
                  p.role.name === "Shoggoth" &&
                  !p.role.revived &&
                  CULT_FACTIONS.includes(p.faction)
              ).length > 0 &&
            this.game
              .alivePlayers()
              .filter((p) => CULT_FACTIONS.includes(p.faction)).length >=
              aliveCount / 2 &&
            aliveCount > 0
          ) {
            factionWin(this);
            return;
          }
        }
        */
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
          this.game.isOneNightMode()
        ) {
          this.player.queueAlert(
            "If a Superhero Spawns, You will need to kill an Independent role in order to win in addition to a Mafia/Cult."
          );
        }

        if (!this.game.guessedSeers) {
          this.game.guessedSeers = {};
        }
        this.game.guessedSeers[this.player.faction] = [];

        if (
          !FACTION_LEARN_TEAM.includes(this.player.faction) &&
          !this.player.hasItem("IsTheTelevangelist")
        )
          return;

        if (this.oblivious["Faction"]) return;

        const assassinInGame = this.game.players.filter(
          (p) => p.role.name === "Assassin"
        );
        if (assassinInGame.length > 0) return;

        if (
          this.game.started == true &&
          this.game.setup.hiddenConverts == true
        ) {
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
        if (player.role.name == "President") {
          const vicePresidents = this.game.players.filter(
            (p) =>
              p.alive &&
              (p.role.data.RoleTargetBackup == "President" ||
                p.role.name == "President")
          );
          if (vicePresidents.length > 0) {
            return;
          }
          this.killedPresident = true;
        }
        if (player.role.name == "Assassin") {
          const otherAssassins = this.game.players.filter(
            (p) =>
              (p.alive && p.role.name == "Assassin") ||
              p.role.data.RoleTargetBackup == "Assassin"
          );
          if (otherAssassins.length > 0 || this.killedPresident == true) {
            return;
          }
          this.killedAssassin = true;
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
          this.player.queueAlert(
            `You are ${this.player.faction} Aligned, You will win with ${this.player.faction}!`
          );
        }
      },
    };

    // seer meeting and state mods
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

            this.game.guessedSeers[this.actor.faction].push(this.target);
            this.target.kill("condemnRevenge", this.actor);
          },
        },
      },
    };

    this.stateMods = {
      Day: {
        type: "delayActions",
        delayActions: true,
      },
      /*
      Dusk: {
        type: "length",
        length: 1000 * 60,
      },
      Overturn: {
        type: "delayActions",
        delayActions: true,
      },
      Sunset: {
        type: "add",
        index: 6,
        length: 1000 * 30,
        shouldSkip: function () {
          if (
            this.game.players.filter((p) => p.role.name == "Seer").length <= 0
          ) {
            return true;
          }

          if (NOT_EVIL_FACTIONS.includes(this.player.faction)) {
            return true;
          }

          if (
            this.game.getRoleAlignment(this.player.role.name) == "Independent"
          ) {
            return true;
          }

          for (let action of this.game.actions[0])
            if (action.target == this.player && action.hasLabel("condemn"))
              return false;

          return true;
        },
      },
      */
    };
  }
};
