// Trophy type definitions
// Extendible: add new trophy types here

const TrophyTypes = {
  gold: {
    name: "Gold",
    icon: "gold-trophy.png",
  },
  silver: {
    name: "Silver",
    icon: "silver-trophy.png",
  },
  bronze: {
    name: "Bronze",
    icon: "bronze-trophy.png",
  },
};

// Array of valid trophy type keys (for validation)
const trophyTypes = Object.keys(TrophyTypes);

// Default trophy type
const defaultTrophyType = "silver";

module.exports = {
  TrophyTypes,
  trophyTypes,
  defaultTrophyType,
};

