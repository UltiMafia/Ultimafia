const effectData = {
  Mafia: {
    //Killing
    Bleeding: {
      internal: ["Bleeding"],
      tags: ["Bleeding"],
      description: "Bleeding players will die during the night.",
    },
    Delirious: {
      internal: ["Delirious"],
      tags: ["Information"],
      description:
        "Delirious players will get false information and have non-information abilities disabled.",
    },
    Doused: {
      internal: ["Knife"],
      tags: ["Day Killer", "Bleeding"],
      description: "Doused players will die if a Match is thrown.",
    },
    Jinxed: {
      internal: ["Jinxed"],
      tags: ["Day Killer", "alignment"],
      description: "Jinxed players will die if they say a Jinxed word.",
    },
    Poisoned: {
      internal: ["Poison"],
      tags: ["Day Killer", "alignment"],
      description: "Poisoned players will die during the night.",
    },
    Lovesick: {
      internal: ["Poison"],
      tags: ["Day Killer", "alignment"],
      description:
        "Lovesick players will die if the player they are in love with dies.",
    },
    Cursed: {
      internal: ["Poison"],
      tags: ["Day Killer", "alignment"],
      description:
        "Cursed players will die if they vote for a particular player.",
    },
    Deafened: {
      internal: ["Poison"],
      tags: ["Day Killer", "alignment"],
      description: "Deafened players cannot read messages from other players.",
    },
    Fiddled: {
      internal: ["Poison"],
      tags: ["Speaking"],
      description:
        "(Fiddled is another name for Deafened) Deafened players cannot read messages from other players.",
    },
    Silenced: {
      internal: ["Poison"],
      tags: ["Speaking"],
      description: "Silenced players cannot speak.",
    },
    Scrambled: {
      internal: ["Scrambled"],
      tags: ["Speaking"],
      description:
        "Scrambled players will see messages as coming from random players.",
    },
    Blind: {
      internal: ["Blind"],
      tags: ["Speaking"],
      description:
        "Blind players will see all messages as anonymous and cannot see votes.",
    },
    //Reflexive/Protective
    Sealed: {
      internal: ["Sealed"],
      tags: ["Speaking"],
      description: "Sealed players can not send or receive whispers.",
    },
    Leaky: {
      internal: ["Sealed"],
      tags: ["Speaking"],
      description: "Leaky players will their whispers always leak.",
    },
    Paralyzed: {
      internal: ["Sealed"],
      tags: ["Voting"],
      description: "Paralyzed players cannot change their votes.",
    },
    Alcoholic: {
      internal: ["Alcoholic"],
      tags: ["Role Blocker"],
      description:
        "Alcoholic players will randomly roleblock a another player each night.",
    },
    Infected: {
      internal: ["Alcoholic"],
      tags: ["Role Blocker"],
      description:
        "Infected players will be converted to Zombies during the night.",
    },
    Hexed: {
      internal: ["Tract"],
      tags: ["Tract"],
      description:
        "Hexed players will convert to Cultist if they say the Hexed word.",
    },
    Mad: {
      internal: ["Bomb"],
      tags: ["Night Killer"],
      description:
        "Mad players must get 2 players to vote for the player they are Mad at.",
    },
    Lycanthropic: {
      internal: ["Lycan"],
      tags: ["Armor"],
      description:
        "Lycanthropic players will visit and kill a random player during a full moon.",
    },
    Plagued: {
      internal: ["Virus"],
      tags: ["Reveal"],
      description:
        "Plagued players will die 1 night after becoming Plagued and will make their neighbors Plagued during the night.",
    },
    //Info
    Insane: {
      internal: ["Insanity"],
      tags: ["Speaking", "Voting"],
      description: "Insane players will speak gibberish and cannot vote.",
    },
    Hosted: {
      internal: ["Insanity"],
      tags: ["Condemn"],
      description:
        "Hosted players will be converted to a Transendant role when condemned.",
    },
    Gassed: {
      internal: ["Insanity"],
      tags: ["Speaking", "Voting"],
      description:
        "Gassed players will die if they visit another player at night.",
    },
    Polarised: {
      internal: ["Insanity"],
      tags: ["Visiting"],
      description:
        "Polarised players will die if they visit another player at night.",
    },
    Frozen: {
      internal: ["Insanity"],
      tags: ["Visiting"],
      description:
        "Polarised players will die if they visit another player at night.",
    },
  },
  Resistance: {},
  Jotto: {},
  Acrotopia: {},
  "Secret Dictator": {},
  "Wacky Words": {},
  "Liars Dice": {},
  "Texas Hold Em": {},
  Cheat: {},
};

module.exports = effectData;
