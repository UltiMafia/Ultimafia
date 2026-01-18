//This can be used to quickly change any fake username if needed
const fakeUserNames = [
  "AngleLover90",
  "BadHat120",
  "SpiningTop23",
  "JohnYellow56",
  "UnbrellaEater31",
  "AgletInspector77",
  "GoldenFlower123",
  "WindowOperator97",
  "ChillZebra12",
  "MagnetSpinner63",
];
let nameArray = fakeUserNames;
export const ExtraRoleData = {
  Mafia: {
    //Village
    "Cop": {
      examples: [
        `On night 1, ${nameArray[0]} the Cop chooses to visit ${nameArray[1]}. ${nameArray[1]}'s role is Villager. At the end of the night, ${nameArray[0]} receives the report "After investigating, you learn that ${nameArray[1]} is Innocent!".`,
        `On night 2, ${nameArray[0]} the Cop chooses to visit ${nameArray[2]}. ${nameArray[2]}'s role is Mafioso. At the end of the night, ${nameArray[0]} receives the report "After investigating, you learn that ${nameArray[2]} is Guilty!".`,
        `On night 3, ${nameArray[0]} the Cop chooses to visit ${nameArray[3]}. ${nameArray[3]}'s role is Fool. At the end of the night, ${nameArray[0]} receives the report "After investigating, you learn that ${nameArray[3]} is Innocent!".`,
        `On night 4, ${nameArray[0]} the Cop chooses to visit ${nameArray[4]}. ${nameArray[4]}'s role is Serial Killer. At the end of the night, ${nameArray[0]} receives the report "After investigating, you learn that ${nameArray[4]} is Guilty!".`,
        `On night 5, ${nameArray[0]} the Cop chooses to visit ${nameArray[5]}. ${nameArray[5]}'s role is Cultist. At the end of the night, ${nameArray[0]} receives the report "After investigating, you learn that ${nameArray[5]} is Guilty!".`,
      ],
    },
    //Cult
    "Reaper": {
      examples: [
        `On day 2 at the start of the day ${nameArray[0]} the Reaper says "I claim Reaper and choose ${nameArray[1]}", ${nameArray[1]}'s role is Cultist. The Village decides to condemn ${nameArray[0]}, ${nameArray[1]} is still alive so Cult wins.`,
        `On day 4 at the start of the day ${nameArray[2]} the Reaper says "i claim reaper and choose ${nameArray[3]}", ${nameArray[3]}'s role is Villager. The Village decides to condemn no one, ${nameArray[3]} is still alive so Village wins.`,
        `On day 1 at the start of the day ${nameArray[4]} the Reaper says "i claim Reaper and Choose ${nameArray[5]}", ${nameArray[5]}'s role is Villager. The Village decides to condemn ${nameArray[5]}, ${nameArray[5]} is dead so the game continues.`,
        `On day 1 after 1 minute of discussion ${nameArray[6]} the Reaper says "I claim Reaper and choose ${nameArray[7]}", the first minute of the day has passed so ${nameArray[6]}'s pick does nothing.`,
      ],
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
  "Connect Four": {},
  Ratscrew: {},
};
