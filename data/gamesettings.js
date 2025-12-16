const gameSettingData = {
  Mafia: {
    /*
    "Placeholder": {
      category: "Standard",
      internal: ["DayStart"],
      tags: ["State", "Time", "Voting"],
      description: "The game starts at day.",
      eventDescription: "This modifier does nothing when on an Event.",
      allowDuplicate: true,
    },
    */
    //Standard
    "Day Start": {
      category: "Standard",
      internal: ["DayStart"],
      tags: ["State", "Time", "Voting"],
      description: "The game starts at day.",
    },
    Whispers: {
      category: "Standard",
      internal: ["Whispers"],
      tags: ["Speaking", "Chat"],
      description:
        "Allow players to privately contact another player in the village meeting.",
    },
    "Whisper Leak Chance": {
      category: "Standard",
      internal: ["Whispers"],
      tags: ["Speaking", "Chat"],
      description:
        "Whispers will have 1% chance to leak (Add this additional times to increase the leak chance). If a whisper leaks then everyone will see it.",
      allowDuplicate: true,
      maxCount: 100,
      requires: ["Whispers"],
    },
    "Whisper Leak Chance x10": {
      category: "Standard",
      internal: ["Whispers"],
      tags: ["Speaking", "Chat"],
      description:
        "Whispers will have 10% chance to leak (Add this additional times to increase the leak chance). If a whisper leaks then everyone will see it.",
      allowDuplicate: true,
      maxCount: 100,
      requires: ["Whispers"],
    },
    "Must Act": {
      category: "Standard",
      internal: ["MustAct"],
      tags: ["Night", "Actions"],
      description:
        "Players cannot select 'no one' for their actions, not including the village meeting.",
    },
    "No Reveal": {
      category: "Standard",
      internal: ["NoReveal"],
      tags: ["Death", "Information"],
      description: "The roles of dead players are not revealed.",
      incompatible: ["Alignment Only Reveal"],
    },
    "Alignment Only Reveal": {
      category: "Standard",
      internal: ["AlignmentOnlyReveal"],
      tags: ["Death", "Information"],
      description: "Only the alignments of dead players are revealed.",
      incompatible: ["No Reveal"],
    },

    //Voting
    "Must Condemn": {
      category: "Voting",
      internal: ["MustCondemn"],
      tags: ["Day", "Voting"],
      description:
        "Players cannot condemn 'no one' during the village meeting.",
    },
    "Hidden Votes": {
      category: "Voting",
      internal: ["HiddenVotes"],
      tags: ["Voting", "Information"],
      description: "Players cannot see who other players are voting.",
    },
    "Majority Voting": {
      category: "Voting",
      internal: ["MajorityVotes"],
      tags: ["Voting"],
      description:
        "A player must get at least 50% of the vote in the village meeting to be condemned.",
    },
    "Voting Dead": {
      category: "Voting",
      internal: ["VotingDead"],
      tags: ["Death", "Voting"],
      description: "Dead players can vote in the village meeting.",
    },

    //Team
    "Silent Mafia": {
      category: "Other",
      internal: ["NoChatMafia"],
      tags: ["Information"],
      description: "Mafia cannot speak at night.",
    },
    "Silent Cult": {
      category: "Other",
      internal: ["NoChatCult"],
      tags: ["Information"],
      description: "Cult cannot speak at night.",
    },
    "Disorganized Mafia": {
      category: "Other",
      internal: ["MafiaNotLearningRoles"],
      tags: ["Information"],
      description:
        "Mafia will not learn their members until the first night and will not learn each others roles.",
    },
    "Disorganized Cult": {
      category: "Other",
      internal: ["CultNotLearningRoles"],
      tags: ["Information"],
      description:
        "Cult will not learn their members until the first night and will not learn each others roles.",
    },

    //Other
    "Role Sharing": {
      category: "Other",
      internal: ["RoleSharing"],
      tags: ["Information"],
      description:
        "Players can use /roleshare to offer a Role Share with another player. If the other player accepts, both players will learn eachothers roles",
    },
    "Alignment Sharing": {
      category: "Other",
      internal: ["AlignmentSharing"],
      tags: ["Information"],
      description:
        "Players can use /alignmentshare to offer a Role Share with another player. If the other player accepts, both players will learn eachothers roles",
    },
    "Private Revealing": {
      category: "Other",
      internal: ["PrivateRevealing"],
      tags: ["Information"],
      description:
        "Players can use /privatereveal to privatly reveal their role to another player.",
    },
    "Public Revealing": {
      category: "Other",
      internal: ["PublicRevealing"],
      tags: ["Information"],
      description:
        "Players can use /publicreveal to privatly reveal their role to all players.",
    },
    "Talking Dead": {
      category: "Other",
      internal: ["TalkingDead"],
      tags: ["Death", "Speaking", "Chat"],
      description: "Dead players can speak in the village meeting.",
    },
    "Hidden Conversions": {
      category: "Other",
      internal: ["HiddenConverts"],
      tags: ["Information"],
      description:
        "Players who change roles will not be told about their role changing.",
    },
    "Cleansing Deaths": {
      category: "Other",
      internal: ["RemoveEffectsFromDead"],
      tags: ["Effect", "Death"],
      description:
        "Players who die will have any malicious effects they have removed.",
    },
    "Last Wills": {
      category: "Other",
      internal: ["LastWills"],
      tags: ["Information", "Death"],
      description:
        "Allow players to write a message that will be revealed when they die.",
    },
    "Hostiles Vs Mafia": {
      category: "Other",
      internal: ["MafiaVsHostile"],
      tags: ["Information", "Death"],
      description:
        "Mafia and Cult cannot win if a Hostile Independent is alive.",
    },
    "Competing Evil Factions": {
      category: "Other",
      internal: ["MafiaVsCult"],
      tags: ["Win-con"],
      description:
        "Mafia and Cult cannot win if a member another Evil faction is alive.",
    },
    "Broadcast Closed Roles": {
      category: "Other",
      internal: ["BroadcastClosedRoles"],
      tags: ["Information"],
      description: "Players can see what roles generated in closed setups.",
    },
    /*
    Austere: {
      category: "Other",
      internal: ["OnlyUseInPlayRoles"],
      tags: ["Austere"],
      description: "This role can only reference roles currently in the game.",
      eventDescription: "This modifier does nothing when on an Event.",
      incompatible: ["Excessive"],
    },
    Bland: {
      category: "Other",
      internal: ["NoSpecialInteractions"],
      tags: ["Bland"],
      description: "Any Special Interactions this role has are disabled.",
      eventDescription: "This modifier does nothing when on an Event.",
    },
    */
  },
  Resistance: {
    Whispers: {
      category: "Standard",
      internal: ["Whispers"],
      tags: ["Speaking", "Chat"],
      description:
        "Allow players to privately contact another player in the village meeting.",
    },
    "Whisper Leak Chance": {
      category: "Standard",
      internal: ["Whispers"],
      tags: ["Speaking", "Chat"],
      description:
        "Whispers will have 1% chance to leak (Add this additional times to increase the leak chance). If a whisper leaks then everyone will see it.",
      allowDuplicate: true,
      requires: ["Whispers"],
    },
  },
  Jotto: {},
  Acrotopia: {},
  "Secret Dictator": {},
  "Secret Hitler": {},
  "Wacky Words": {},
  "Liars Dice": {
    Whispers: {
      category: "Standard",
      internal: ["Whispers"],
      tags: ["Speaking", "Chat"],
      description:
        "Allow players to privately contact another player in the village meeting.",
    },
    "Whisper Leak Chance": {
      category: "Standard",
      internal: ["Whispers"],
      tags: ["Speaking", "Chat"],
      description:
        "Whispers will have 1% chance to leak (Add this additional times to increase the leak chance). If a whisper leaks then everyone will see it.",
      allowDuplicate: true,
      requires: ["Whispers"],
    },
  },
  "Texas Hold Em": {
    Whispers: {
      category: "Standard",
      internal: ["Whispers"],
      tags: ["Speaking", "Chat"],
      description:
        "Allow players to privately contact another player in the village meeting.",
    },
    "Whisper Leak Chance": {
      category: "Standard",
      internal: ["Whispers"],
      tags: ["Speaking", "Chat"],
      description:
        "Whispers will have 1% chance to leak (Add this additional times to increase the leak chance). If a whisper leaks then everyone will see it.",
      allowDuplicate: true,
      requires: ["Whispers"],
    },
  },
  Cheat: {
    Whispers: {
      category: "Standard",
      internal: ["Whispers"],
      tags: ["Speaking", "Chat"],
      description:
        "Allow players to privately contact another player in the village meeting.",
    },
    "Whisper Leak Chance": {
      category: "Standard",
      internal: ["Whispers"],
      tags: ["Speaking", "Chat"],
      description:
        "Whispers will have 1% chance to leak (Add this additional times to increase the leak chance). If a whisper leaks then everyone will see it.",
      allowDuplicate: true,
      requires: ["Whispers"],
    },
  },
  Ratscrew: {
    Whispers: {
      category: "Standard",
      internal: ["Whispers"],
      tags: ["Speaking", "Chat"],
      description:
        "Allow players to privately contact another player in the village meeting.",
    },
    "Whisper Leak Chance": {
      category: "Standard",
      internal: ["Whispers"],
      tags: ["Speaking", "Chat"],
      description:
        "Whispers will have 1% chance to leak (Add this additional times to increase the leak chance). If a whisper leaks then everyone will see it.",
      allowDuplicate: true,
      requires: ["Whispers"],
    },
  },
  Battlesnakes: {},
  "Dice Wars": {},
  "Connect Four": {
    Whispers: {
      category: "Standard",
      internal: ["Whispers"],
      tags: ["Speaking", "Chat"],
      description:
        "Allow players to privately contact another player in the village meeting.",
    },
    "Whisper Leak Chance": {
      category: "Standard",
      internal: ["Whispers"],
      tags: ["Speaking", "Chat"],
      description:
        "Whispers will have 1% chance to leak (Add this additional times to increase the leak chance). If a whisper leaks then everyone will see it.",
      allowDuplicate: true,
      requires: ["Whispers"],
    },
  },
};

module.exports = gameSettingData;
