// The tutorial's fixed Frontier Justice setup. Not stored in the database.
const SETUP = {
  id: "tutorial-frontier-justice",
  name: "Frontier Justice (Tutorial)",
  gameType: "Mafia",
  total: 9,
  roles: [
    {
      "Cop:": 1,
      "Journalist:": 1,
      "Sheriff:": 1,
      "Villager:": 3,
      "Janitor:": 1,
      "Lawyer:Loyal": 1,
      "Mafioso:": 1,
    },
  ],
  closed: false,
  unique: false,
  uniqueWithoutModifier: false,
  count: {},
};

module.exports = SETUP;
