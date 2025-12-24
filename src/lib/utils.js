import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export const getNormalizedWeek = (game) => {
  if (game.seasonType === 'regular') {
    return game.week; // weeks 1–16
  }
  if (game.seasonType === 'postseason') {
    // shift postseason weeks to follow after regular season
    return 16 + game.week;
  }
  return game.week;
};

export const normalizeScheduleWeeks = (schedule) => {
  let maxPostWeeks = 0;

  // annotate games with normalized week
  schedule.data.forEach((teamData) => {
    let postCounter = 0;
    teamData.games.forEach((game) => {
      if (game.seasonType === 'regular') {
        game.normalizedWeek = game.week;
      } else if (game.seasonType === 'postseason') {
        postCounter += 1;
        game.normalizedWeek = 16 + postCounter;
        if (postCounter > maxPostWeeks) {
          maxPostWeeks = postCounter;
        }
      }
    });
  });

  // build master week list
  const allWeeks = [
    ...Array.from({ length: 16 }, (_, i) => i + 1), // regular season
    ...Array.from({ length: maxPostWeeks }, (_, i) => 17 + i), // postseason
  ];

  return allWeeks;
};

// get AP rank of opponent for given week
export const getTeamRank = (teamName, game, seasonPolls) => {
  let pollWeek = seasonPolls.data.find(
    (p) => p.week === game.week && p.seasonType === game.seasonType
  );
  if (!pollWeek) {
    // fallback to latest available poll
    pollWeek = seasonPolls.data.sort((a, b) => {
      if (a.seasonType === 'postseason' && b.seasonType === 'regular') return 1;
      if (a.seasonType === 'regular' && b.seasonType === 'postseason') return -1;
      return b.week - a.week;
    })[0];
  }
  const polls = pollWeek?.polls?.find((p) => p.poll === 'AP Top 25');

  if (!polls) return null;
  const ranking = polls.ranks.find((entry) => entry.school === teamName);
  return ranking ? ranking.rank : null;
};

// calculate points for a single game
export const calculateGamePoints = (game, team, week, sitPlan, polls, franchiseTeam) => {
  // console.log('LOG: game week', game, week)
  const isHome = game.homeTeam === team;
  const teamPoints = isHome ? game.homePoints : game.awayPoints;
  const oppPoints = isHome ? game.awayPoints : game.homePoints;
  const opponent = isHome ? game.awayTeam : game.homeTeam;

  if (teamPoints == null || oppPoints == null) return 0; // not completed

  const isWin = teamPoints > oppPoints;
  const isSitWeek = sitPlan[team] === week;
  const oppRank = getTeamRank(opponent, game, polls);

  let points = 0;

  if (isWin) {
    if (isSitWeek && team !== franchiseTeam) {
      points = -4; // sat a winning team
    } else {
      if (oppRank === 1) points = 7;
      else if (oppRank && oppRank <= 5) points = 5;
      else if (oppRank && oppRank <= 10) points = 4;
      else points = 3;
    }
  } else {
    if (isSitWeek && team !== franchiseTeam) {
      points = 2; // sat a losing team
    } else {
      points = 0;
    }
  }

  return points;
};

// calculate total season points for a team
export const calculateSeasonPoints = (teamData, sitPlan, polls, franchiseTeam) => {
  return teamData.games.reduce((sum, game) => {
    return sum + calculateGamePoints(game, teamData.team, getNormalizedWeek(game), sitPlan, polls, franchiseTeam);
  }, 0);
};
