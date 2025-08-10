const Winners = require("../../core/Winners");
const { CULT_FACTIONS, MAFIA_FACTIONS } = require("./const/FactionList");

module.exports = class MafiaWinners extends Winners {
  constructor(name, player, data) {
    super(name, player, data);
  }

  handleBraggadocious() {
    var braggadociousWinner = false;
    for (let group in this.groups) {
      for (let player of this.groups[group]) {
        if (
          player.hasEffect("Braggadocious") &&
          player.role.alignment === "Independent"
        ) {
          // braggadocious does nothing for faction aligned players
          braggadociousWinner = true;
          break;
        }
      }
    }

    if (braggadociousWinner) {
      for (let x = 0; x < MAFIA_FACTIONS.length; x++) {
        if (this.groups[MAFIA_FACTIONS[x]]) {
          this.removeGroup(MAFIA_FACTIONS[x]);
        }
      }
      for (let x = 0; x < CULT_FACTIONS.length; x++) {
        if (this.groups[CULT_FACTIONS[x]]) {
          this.removeGroup(CULT_FACTIONS[x]);
        }
      }

      if (this.groups["Village"]) {
        this.removeGroup("Village");
      }
    }
  }

  getGroupWinMessage(group, plural) {
    switch (group) {
      case "Village":
        return ":flagblue: The Village has successfully driven out the scum and villainy from their home!";
      case "Mafia":
        return ":flagblack: The Mafia has deceived its way into victory. Make sure you've paid your protection money.";
      case "Cult":
        return ":flagyellow: The dark gods of the Cult have been unleashed. The town has been reduced to a blasted heath.";
      case "Alien":
        return "An Alien mothership arrived overhead, abducting all of the probed victims from the town.";
      case "Anarchist":
        return "Once the dust had settled, it was obvious that nobody in town was safe from the Anarchist.";
      case "Angel":
        return "The Angel made the ultimate sacrifice for their beloved and has given them favor in the Heavens.";
      case "Astrologer":
        return "The Astrologer wrote the fate of their chosen lovers in the stars, and their love in the time of Mafia would be told throughout the generations.";
      case "Autocrat":
        return "The Village thought that they had saved the day, but the Autocrat's oppressive rule smothered any remaining hope.";
      case "Blob":
        return "The Blob trapped everyone in its path, expanding to prodigious size until overflowing into a cave system deep below the town, where it is said to lurk and writhe to this day.";
      case "Clockmaker":
        return "When the bell tower rang out at 12, everyone knew that the Clockmaker's hour had come.";
      case "Communist":
        return "The means of production has been seized from the Bourgeoisie, paving the way for a Communist revolution!";
      case "Creepy Girl":
        return "After burying the last body, the haunted doll was put to rest. The Creepy Girl was free to lead her own life.";
      case "Dentist":
        return ":) A toxic cloud of nitrous rolled over the town leaving none alive… the mad Dentist's hideous laugh echoed through empty streets, every corpse left with a rictus grin.";
      case "Doppelgänger":
        return "How little was the truth suspected? Well, it's too late now! The Doppelgänger has taken the place of their target, and they remain forgotten.";
      case "Dodo":
        return "If this were target practice then that would have been a crack shot! Unfortunately, someone just killed the last living Dodo.";
      case "Dragoon":
        return ":shotgun: Did they fire six shots or only five? To tell the truth, in all the confusion, the Dragoon lost track themselves. The town felt lucky, and they were wrong.";
      case "Emperor":
        return "By traditional duel, the Emperor selected the best warriors the town had to offer and took them back to the Empire to be trained. Years later, all resistance in the town was crushed and a fort was built upon its ruins.";
      case "Executioner":
        return "The Executioner finally got to pull the lever on their begrudged victim.";
      case "Fatalist":
        return "The Fatalist's victory was bittersweet. Some people are just born with tragedy in their blood.";
      case "Fool":
        return "Who is more foolish: the Fool, or the fools who condemned them?";
      case "Gambler":
        return "The town bet against the Gambler, but the Gambler won.";
      case "Gingerbread Man":
        return "Nobody could catch up to the Gingerbread Man.";
      case "Grey Goo":
        return ":scream: On and on the Grey Goo travelled, leaving behind this world and breaching great filters.";
      case "Grizzly Bear":
        return "In just a few short nights a terrifying Grizzly Bear took the town by storm and killed everyone. So far, none have returned from the woods trying to exact revenge.";
      case "Grouch":
        return "Although the Village had lost, the Grouch rejoiced at their misery.";
      case "Hellhound":
        return "The town was ravaged by a demon in the shape of a beast. Under the Blood Moon, one can still hear the baying of the Hellhound.";
      case "Joker":
        return "The Joker got to have the last laugh.";
      case "Judge":
        return ":hammer: Sickened by the tyranny of the villagers, the Judge put on a trial for the whole of the town and exacted their own brand of justice.";
      case "Leprechaun":
        return "The Leprechaun retrieved all of their four-leaf clovers and got out of town at the next opportunity!";
      case "Lover":
        return "Through it all, the Lover made it out alive with their beloved.";
      case "Magus":
        return "As above, so below. With the Village's paranoia subsided, the Magus could ascend to greater mysteries beyond this mortal plane.";
      case "Mastermind":
        return "The Mafia thought that their day had come, but they soon found themselves under the thumb of the Mastermind.";
      case "Matchmaker":
        return ":mistletoe: The Matchmaker proved that love conquers all, claiming the town for themselves.";
      case "Monk":
        return "By eschewing violence, the Monk enlightened the town and converted them to the ways of the Monastery.";
      case "Mutineer":
        return "The Mafia thought they had won, but were soon picked off by a Mutineer within their ranks.";
      case "Nomad":
        return "The Nomad settled down among the townsfolk and made their allegiance known.";
      case "Palladist":
        return "Although the Village had driven out their foes, their Masonic Lodge had been beset by an evil from within. The eerie cult of the Palladist and their unwitting minions have started to take root in nearby towns and across the countryside..";
      case "Panda Bear":
        return ":panda: Unfortunately for the Village, there would be no baby Panda Bears at the zoo this year. Having failed to mate them, their neighbors took the Pandas home and left the Village without any relief money following the crisis.";
      case "Polar Bear":
        return "Blessed by the Aurora Borealis, the Polar Bear fought its way to freedom and fled for true north. The town was left ravaged by its magnetic powers.";
      case "Politician":
        return "By knowing when to switch sides, the Politician succeeded in coming to power and remembered to favor those who supported them during the crisis.";
      case "Prince":
        return "Returning to the homeland, the Prince made a strategic alliance and seized power during the trials. Their new regime would be celebrated for many years thereafter.";
      case "Prophet":
        return "Nobody believed in the words of the Prophet until the day finally came and they were right.";
      case "Pyromaniac":
        return "In the midst of their crisis, the whole town was burned to the ground by a Pyromaniac!";
      case "Ripper":
        return "The streets used to be riddled with evildoers, but now people only remember the name of the Ripper.";
      case "Rival":
        return "With so many Rivals, there could only be one king of the hill.";
      case "Serial Killer":
        return "The town was powerless against the Serial Killer and the terror they brought in the night. It has been abandoned.";
      case "Shinigami":
        return "Once the notebook had claimed its final victim, the town submitted to the demands of the Shinigami: an endless supply of apples…";
      case "Sidekick":
        return "The Sidekick cleared the way for their partner's victory.";
      case "Siren":
        return "Nobody goes down by the lake anymore. It is said that at night you can still hear the Siren's song.";
      case "Snowman":
        return ":snowman: The Snowman's hapless victims fell to its cruel games. They will remain frozen, trapped as opulent sculptures of ice, for all eternity…";
      case "Supervillain":
        return "Here's a little lesson in trickery, this is going down in history. If you wanna be a villain number one, then look no further than the Supervillain.";
      case "Survivor":
        return "Through the carnage, the Survivor drifted on.";
      case "Style Points":
        return "When you are the most stylish you can't really lose.";
      case "Tofurkey":
        return ":turkey: The grain shipments arrived in town a day too late. The streets were filled with wild Turkeys…";
      case "Turkey":
        return ":turkey: The grain shipments arrived in town a day too late. The streets were filled with wild Turkeys…";
      case "Usurper":
        return "The Mafia thought that they had claimed the town, but they were stripped of their power by the Usurper.";
      case "Vengeful Spirit":
        return "After dragging their enemies down with them, the Vengeful Spirit could finally pass on to the next life.";
      case "Warlock":
        return "Using the gallows as a font for damned souls, the Warlock's weirding ways brought a great doom to the Town and its humble way of life.";
      case "Yandere":
        return "Beyond lovesick, the Yandere cut down all that stood between them and their beloved.";
      default:
        return super.getGroupWinMessage(group, plural);
    }
  }
};
