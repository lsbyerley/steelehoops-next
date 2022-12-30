import inRange from 'lodash.inrange';
import round from 'lodash.round';

// Complementary error function
// From Numerical Recipes in C 2e p221
// https://github.com/errcw/gaussian/blob/master/lib/gaussian.js
function erfc(x) {
  var z = Math.abs(x);
  var t = 1 / (1 + z / 2);
  var r =
    t *
    Math.exp(
      -z * z -
        1.26551223 +
        t *
          (1.00002368 +
            t *
              (0.37409196 +
                t *
                  (0.09678418 +
                    t *
                      (-0.18628806 +
                        t *
                          (0.27886807 +
                            t *
                              (-1.13520398 +
                                t *
                                  (1.48851587 +
                                    t * (-0.82215223 + t * 0.17087277))))))))
    );
  return x >= 0 ? r : 2 - r;
}

function cumulativeDistribution(x, mean, standardDeviation) {
  return 0.5 * erfc(-(x - mean) / (standardDeviation * Math.sqrt(2)));
}

const predictor = (
  neutralSite,
  awayTeamRating,
  homeTeamRating,
  averageTempo,
  averageEfficiency
) => {
  const homeCourtAdvantage = 3.5; //Ken Pomeroy purportedly uses 3.5 points for home court advantage
  const standardDeviation = 11; //Ken Pomeroy purportedly uses 11 points for the standard deviation
  const D1AverageTempo = averageTempo;
  const D1AverageEfficiency = averageEfficiency;

  // AWAY TEAM VARIABLES
  const awayAdjEM = parseFloat(awayTeamRating.adjEM);
  const awayTempo = awayTeamRating.adjT;
  const awayOffensiveEfficiency = awayTeamRating.adjO;
  const awayDefensiveEfficiency = awayTeamRating.adjD;

  // HOME TEAM VARIABLES
  const homeAdjEM = parseFloat(homeTeamRating.adjEM);
  const homeTempo = homeTeamRating.adjT;
  const homeOffensiveEfficiency = homeTeamRating.adjO;
  const homeDefensiveEfficiency = homeTeamRating.adjD;

  // EXPECTED TEMPO
  let expectedTempo = awayTempo + homeTempo - D1AverageTempo;

  // AWAY EXPECTED OUTPUT
  const awayExpectedOutputNeutral =
    ((awayOffensiveEfficiency + homeDefensiveEfficiency - D1AverageEfficiency) /
      100) *
    expectedTempo;
  const awayExpectedOutput = awayExpectedOutputNeutral - homeCourtAdvantage / 2;

  // HOME EXPECTED OUTPUT
  const homeExpectedOutputNeutral =
    ((homeOffensiveEfficiency + awayDefensiveEfficiency - D1AverageEfficiency) /
      100) *
    expectedTempo;
  const homeExpectedOutput = homeExpectedOutputNeutral + homeCourtAdvantage / 2;

  // AWAY POINT DIFFERENTIAL AND WIN PROBABILITY
  //const awayPointDiffNeutral = ((awayAdjEM - homeAdjEM) * (awayTempo + homeTempo) / 200)
  //const awayPointDiff = awayPointDiffNeutral - (homeCourtAdvantage/2)
  const awayPointDiffNeutral =
    awayExpectedOutputNeutral - homeExpectedOutputNeutral;
  const awayPointDiff = awayExpectedOutput - homeExpectedOutput;
  const awayWinProbability = cumulativeDistribution(
    awayPointDiff,
    0,
    standardDeviation
  );
  const awayWinProbabilityNeutral = cumulativeDistribution(
    awayPointDiffNeutral,
    0,
    standardDeviation
  );

  // HOME POINT DIFFERENTIAL AND WIN PROBABILITY
  //const homePointDiffNeutral = ((homeAdjEM - awayAdjEM) * (awayTempo + homeTempo) / 200)
  //const homePointDiff = homePointDiffNeutral + (homeCourtAdvantage/2)
  const homePointDiffNeutral =
    homeExpectedOutputNeutral - awayExpectedOutputNeutral;
  const homePointDiff = homeExpectedOutput - awayExpectedOutput;
  const homeWinProbability = cumulativeDistribution(
    homePointDiff,
    0,
    standardDeviation
  );
  const homeWinProbabilityNeutral = cumulativeDistribution(
    homePointDiffNeutral,
    0,
    standardDeviation
  );

  let tempoText = '';
  const highestTempo = D1AverageTempo + 10;
  const lowestTempo = D1AverageTempo - 10;
  if (expectedTempo >= highestTempo) {
    tempoText = 'Very Fast';
  } else if (inRange(expectedTempo, highestTempo, D1AverageTempo + 2)) {
    tempoText = 'Fast';
  } else if (inRange(expectedTempo, D1AverageTempo + 2, D1AverageTempo - 2)) {
    tempoText = 'Normal';
  } else if (inRange(expectedTempo, D1AverageTempo - 2, lowestTempo)) {
    tempoText = 'Slow';
  } else if (expectedTempo <= lowestTempo) {
    tempoText = 'Very Slow';
  }
  expectedTempo = round(expectedTempo, 1);

  let total,
    awayTotal,
    awayLine,
    awayWinPerc,
    homeTotal,
    homeLine,
    homeWinPerc,
    shFave;
  if (neutralSite) {
    total = round(awayExpectedOutputNeutral + homeExpectedOutputNeutral, 1);
    awayTotal = round(awayExpectedOutputNeutral, 1);
    awayLine = round(awayExpectedOutputNeutral - homeExpectedOutputNeutral, 1);
    awayWinPerc = round(awayWinProbabilityNeutral * 100, 1);
    homeTotal = round(homeExpectedOutputNeutral, 1);
    homeLine = round(homeExpectedOutputNeutral - awayExpectedOutputNeutral, 1);
    homeWinPerc = round(homeWinProbabilityNeutral * 100, 1);

    shFave =
      homeExpectedOutputNeutral > awayExpectedOutputNeutral ? 'home' : 'away';
  } else {
    total = round(awayExpectedOutput + homeExpectedOutput, 1);
    awayTotal = round(awayExpectedOutput, 1);
    awayLine = round(awayExpectedOutput - homeExpectedOutput, 1);
    awayWinPerc = round(awayWinProbability * 100, 1);
    homeTotal = round(homeExpectedOutput, 1);
    homeLine = round(homeExpectedOutput - awayExpectedOutput, 1);
    homeWinPerc = round(homeWinProbability * 100, 1);

    shFave = homeExpectedOutput > awayExpectedOutput ? 'home' : 'away';
  }

  return {
    shFave,
    expectedTempo,
    tempoText,
    total,
    awayTotal,
    awayLine,
    awayWinPerc,
    homeTotal,
    homeLine,
    homeWinPerc,
  };
};

export default predictor;
