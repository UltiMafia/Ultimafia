const mafiaStatsObj = {
  totalGames: 0,
  wins: {
    count: 0, // games won
    total: 0, // games completed (wins + losses, excludes abandons)
  },
  abandons: {
    count: 0, // games abandoned
    total: 0, // always equals count (recordStat always called with inc=true)
  },
};

const mafiaStatsBucket = {
  ...mafiaStatsObj,
  bySetup: {},
  byRole: {},
  byAlignment: {},
};

const mafiaStatsSet = {
  // "all" is legacy — contains only ranked + competitive stats
  all: mafiaStatsBucket,
  unranked: mafiaStatsBucket,
};

const allStats = {
  Mafia: mafiaStatsSet,
};

module.exports = {
  allStats: () => JSON.parse(JSON.stringify(allStats)),
  statsSet: (gameType) => JSON.parse(JSON.stringify(allStats[gameType])),
  statsObj: (gameType) => JSON.parse(JSON.stringify(allStats[gameType].all)),
};
