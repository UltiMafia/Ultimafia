const { ordinal, rating, rate, predictWin } = require("openskill");
const { bradleyTerryFull, thurstoneMostellerFull, plackettLuce } = require("openskill/models");

const toMap = (obj) => new Map(Object.entries(obj));

const defaultScenario = {
  name: "myScenario",
  sequence: [],
  pointsNominalAmount: 60,
  defaultSkillRatingMu: 750,
  defaultSkillRatingSigma: 250,
  options: {
    model: plackettLuce,
    beta: 1000,
  },
}

const fiveMafiaWins = [
  toMap({ "Mafia": 1, "Village": 0, }),
  toMap({ "Mafia": 1, "Village": 0, }),
  toMap({ "Mafia": 1, "Village": 0, }),
  toMap({ "Mafia": 1, "Village": 0, }),
  toMap({ "Mafia": 1, "Village": 0, }),
];

const fiveVillageWins = [
  toMap({ "Mafia": 0, "Village": 1, }),
  toMap({ "Mafia": 0, "Village": 1, }),
  toMap({ "Mafia": 0, "Village": 1, }),
  toMap({ "Mafia": 0, "Village": 1, }),
  toMap({ "Mafia": 0, "Village": 1, }),
];

const village33winrate = [
  ...fiveMafiaWins,
  ...fiveMafiaWins,
  ...fiveVillageWins,
];

// Use a "true" winrate of 33% for village
let scenario1 = {...defaultScenario};
scenario1.sequence = [
  ...village33winrate,
  ...village33winrate,
  ...village33winrate,
  ...village33winrate,
  ...village33winrate,
  ...village33winrate,
  ...village33winrate,
  ...village33winrate,
  ...village33winrate,
  ...village33winrate,
];

runScenario(scenario1);

function runScenario(scenario) {
  let factionRatingsState = [];

  for (let j = 0; j < scenario.sequence.length; j++) {
    console.log(`====================================== GAME ${j}`);
    const factionScores = scenario.sequence[j];

    // default the group ratings to an empty array if not yet exists
    const factionsToBeRated = new Map(
      factionRatingsState.map((factionRating) => [
        factionRating.factionName,
        factionRating.skillRating,
      ])
    );

    for (const factionName of factionScores.keys()) {
      const factionRating = factionsToBeRated.get(factionName);

      // Default initialize the faction rating for the setup if it doesn't yet exist
      if (factionRating === undefined) {
        factionsToBeRated.set(factionName, rating({
          mu: scenario.defaultSkillRatingMu,
          sigma: scenario.defaultSkillRatingSigma,
        }));
      }
    }

    const factionNames = [...factionsToBeRated.keys()];

    const factionsToBeRatedRaw = factionNames.map(factionName => [factionsToBeRated.get(factionName)]);
    const factionScoresRaw = factionNames.map(factionName => factionScores.get(factionName));

    // library code time
    const predictions = predictWin(factionsToBeRatedRaw, scenario.options);
    const ratedFactions = rate(factionsToBeRatedRaw, {
      score: factionScoresRaw,
      ...scenario.options
    });

    // Transform the results from the rate and predictWin functions back into their usable forms
    const pointsWonByFactions = {};
    const pointsLostByFactions = {};
    const newFactionSkillRatings = factionRatingsState.filter(
      (factionRating) => !factionNames.includes(factionRating.factionName)
    );

    // numbers for approximating the "look" of elo
    const alpha = 200 / scenario.defaultSkillRatingSigma;
    const ordinalTarget = 1500;

    for (var i = 0; i < factionNames.length; i++) {
      const factionName = factionNames[i];
      const winPredictionPercent = predictions[i]; // this adds up to 1 across all factions
      const newSkillRating = ratedFactions[i];
      console.log(`${factionName} win ${100*winPredictionPercent.toFixed(2)}%`);

      pointsWonByFactions[factionName] = Math.round(
        2 * scenario.pointsNominalAmount * (1 - winPredictionPercent)
      );
      pointsLostByFactions[factionName] = Math.round(
        2 * scenario.pointsNominalAmount * winPredictionPercent
      );

      newFactionSkillRatings.push({
        factionName: factionName,
        skillRating: newSkillRating[0],
        elo: alpha * (ordinal(newSkillRating[0]) + ordinalTarget / alpha),
      });

      factionRatingsState = newFactionSkillRatings;
    }

    for (const factionName of Object.keys(pointsWonByFactions)) {
      console.log(`${factionName} would win ${pointsWonByFactions[factionName]} points`);
    }
    for (const factionSkillRating of newFactionSkillRatings) {
      console.log(`${factionSkillRating.factionName}: ${factionSkillRating.skillRating.mu}μ / ${factionSkillRating.skillRating.sigma}σ`);
    }
  }
}
