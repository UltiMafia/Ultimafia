const mafiaStatsObj = {
    totalGames: 0,
    wins: {
        count: 0,
        total: 0,
    },
    abandons: {
        count: 0,
        total: 0,
    },
};

const mafiaStatsSet = {
    all: mafiaStatsObj,
    bySetup: {},
    byRole: {},
    byAlignment: {},
};

const allStats = {
    "Mafia": mafiaStatsSet,
};

module.exports = {
    allStats: () => JSON.parse(JSON.stringify(allStats)),
    statsSet: (gameType) => JSON.parse(JSON.stringify(allStats[gameType])),
    statsObj: (gameType) => JSON.parse(JSON.stringify(allStats[gameType].all)),
}; 