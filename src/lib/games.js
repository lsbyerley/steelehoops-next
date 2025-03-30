import { isValid, format, parse, parseISO } from 'date-fns';
import { formatInTimeZone } from 'date-fns-tz';
import axios from 'axios';
import get from 'just-safe-get';
import round from 'lodash.round';
import predictor from './predictor';
import normalizeTeam from './normalizeTeam';

//----------------------------------------------------------------------------//
// Group ID's
// 100 = NCAA Tournament
// 52 = all post season tournaments (games are wonky in this group)
// 50 = all D1 (doesn't include NCAAT games, THIS HAS CHANGED IT DOES NOW)
// Season Type
// 2 = regular season
// 3 = post season
// when attaching seasontype, live stats are more up to date
//----------------------------------------------------------------------------//

const getGames = async (paramDate, teamRatings, teamStats, groupId) => {
  let useTestGames = false;
  let gamesData;

  try {
    let groups = groupId || 50;
    // let groups = 100;
    let seasonType = '&seasontype=2'; // TODO: toggle this based on when season is
    let gamesDate = format(new Date(), 'yyyyMMdd');
    let areAnyGamesLive = false;
    if (paramDate === 'usetest') {
      useTestGames = true;
    } else if (paramDate && isValid(parse(paramDate, 'yyyyMMdd', new Date()))) {
      gamesDate = paramDate;
    }

    const apiBase =
      'http://site.web.api.espn.com/apis/site/v2/sports/basketball/mens-college-basketball/scoreboard';
    const apiParams = `lang=en&region=us&calendartype=blacklist&limit=300&tz=America%2FNew_York&groups=${groups}${seasonType}`;
    const gamesUrl = `${apiBase}?${apiParams}&dates=${gamesDate}`;

    if (useTestGames) {
      console.log('using test games');
      const testgames = require('../data/games-test-res.json');
      gamesDate = get(testgames, 'events.0.date');
      gamesData = get(testgames, 'events');
    } else {
      const gamesRes = await axios.get(gamesUrl);
      gamesData = get(gamesRes, 'data.events');
    }

    // debug log
    console.log(
      `---- LOG: getGames ------
      \rteamRatings type: ${teamRatings?.type}
      \rteamStats type: ${teamStats?.type}
      \rgames url: ${gamesUrl}
      --------------------------`
    );

    let games = [],
      inpostGames = [],
      htGames = [],
      noOdds = [],
      nonMatches = [],
      confs = ['All'];

    if (gamesData) {
      gamesData.forEach((game, i) => {
        const startTime = formatInTimeZone(
          parseISO(get(game, 'competitions.0.date')),
          'America/New_York',
          'h:mm a'
        );
        const teamOne = get(game, 'competitions.0.competitors.0');
        const teamTwo = get(game, 'competitions.0.competitors.1');
        let vegasLine = get(game, 'competitions.0.odds.0.details');
        let vegasTotal = get(game, 'competitions.0.odds.0.overUnder');
        const neutralSite = get(game, 'competitions.0.neutralSite');
        const note = get(game, 'competitions.0.notes.0.headline');
        const status = {
          id: get(game, 'status.type.id'),
          state: get(game, 'status.type.state'),
          detail: get(game, 'status.type.shortDetail'),
        };

        let awayTeam =
          teamOne?.homeAway === 'away'
            ? normalizeTeam(teamOne)
            : normalizeTeam(teamTwo);
        let homeTeam =
          teamTwo?.homeAway === 'home'
            ? normalizeTeam(teamTwo)
            : normalizeTeam(teamOne);

        if (status.state === 'in') {
          areAnyGamesLive = true;
        }

        /*
         * ADD KENPOM FOR EACH TEAM
         */
        awayTeam.kenPom = teamRatings?.ratings
          ? teamRatings?.ratings.find((tr) => {
              return tr.team === awayTeam.kpName;
            })
          : null;
        if (!awayTeam.kenPom) {
          nonMatches.push(
            'KP Away: ' + awayTeam.name + ' - ' + awayTeam.kpName
          );
        }

        homeTeam.kenPom = teamRatings?.ratings
          ? teamRatings?.ratings.find((tr) => {
              return tr.team === homeTeam.kpName;
            })
          : null;
        if (!homeTeam.kenPom) {
          nonMatches.push(
            'KP Home: ' + homeTeam.name + ' - ' + homeTeam.kpName
          );
        }

        /*
         * ADD STATS FOR EACH TEAM
         */
        awayTeam.stats = teamStats?.stats.find((ts) => {
          return ts.team === awayTeam.statName;
        });
        if (!awayTeam.stats) {
          nonMatches.push(
            'Stats Away: ' + awayTeam.name + ' - ' + awayTeam.statName
          );
        }

        homeTeam.stats = teamStats?.stats.find((ts) => {
          return ts.team === homeTeam.statName;
        });
        if (!homeTeam.stats) {
          nonMatches.push(
            'Stats Home: ' + homeTeam.name + ' - ' + homeTeam.statName
          );
        }

        /*
         * CALCULATING SURPLUS THREES
         */
        let hasSurplusThrees = false,
          surplusThreeDiff = 0,
          halftimeAction = '',
          surplusTeam = '';
        if (
          status.state === 'in' &&
          status.id === '23' &&
          awayTeam.hasESPNStats &&
          homeTeam.hasESPNStats &&
          awayTeam.stats &&
          awayTeam.threePtAtt &&
          awayTeam.threePtMade &&
          homeTeam.stats &&
          homeTeam.threePtAtt &&
          homeTeam.threePtMade
        ) {
          let atSurplusThrees =
            awayTeam.threePtMade - awayTeam.threePtAtt * awayTeam.stats.fg3_pct;
          let htSurplusThrees =
            homeTeam.threePtMade - homeTeam.threePtAtt * homeTeam.stats.fg3_pct;

          awayTeam.stats.surplusThrees = round(atSurplusThrees, 2);
          homeTeam.stats.surplusThrees = round(htSurplusThrees, 2);

          surplusTeam = htSurplusThrees < atSurplusThrees ? 'home' : 'away';
          let scoringMargin =
            surplusTeam === 'home'
              ? homeTeam.score - awayTeam.score
              : awayTeam.score - homeTeam.score;
          surplusThreeDiff = round(
            Math.abs(atSurplusThrees - htSurplusThrees),
            2
          );

          if (surplusThreeDiff >= 1 && scoringMargin >= 0) {
            halftimeAction = 'yes-bet';
          } else {
            halftimeAction = 'no-bet';
          }

          hasSurplusThrees = true;
        }

        let prediction,
          kpDiff = 0;
        if (awayTeam.kenPom && homeTeam.kenPom) {
          prediction = predictor(
            neutralSite,
            awayTeam.kenPom,
            homeTeam.kenPom,
            teamRatings?.avgTempo,
            teamRatings?.avgEfficiency
          );
          kpDiff = Math.abs(awayTeam.kenPom.rank - homeTeam.kenPom.rank);
        }

        let totalDiff = '-',
          lineDiff = '-',
          shFactor = 0,
          addPre = false,
          vegasFave = '';

        if (prediction) {
          addPre = true;
        }

        if (prediction && (vegasLine || vegasTotal)) {
          if (vegasTotal && vegasTotal > 0) {
            totalDiff = Math.abs(vegasTotal - prediction.total);
            totalDiff = round(totalDiff, 1);
          }

          if (vegasLine) {
            let vegasSpread = 0;
            if (vegasLine !== 'EVEN') {
              let split = vegasLine.split(' ');
              if (split.length == 2) {
                vegasFave = split[0] === homeTeam.abbrev ? 'home' : 'away';
                vegasSpread = split[1];
                vegasSpread = vegasSpread.replace('-', '');
                vegasSpread = round(vegasSpread, '1');
              }
            }

            let shSpread =
              prediction.awayLine > 0
                ? prediction.awayLine
                : prediction.homeLine;

            if (vegasFave !== prediction.shFave) {
              // this looks odd but the prediction generator has the favorite as a positive number instead of negative
              // TODO: change that in the predictor
              let linetodiff =
                prediction.shFave === 'away'
                  ? prediction.homeLine
                  : prediction.awayLine;
              lineDiff = vegasSpread - linetodiff;
            } else {
              lineDiff =
                vegasSpread > shSpread
                  ? vegasSpread - shSpread
                  : shSpread - vegasSpread;
              lineDiff = Math.abs(vegasSpread - shSpread);
            }

            lineDiff = round(lineDiff, '1');
          }

          shFactor = lineDiff + totalDiff;
          shFactor = round(shFactor, '1');
        }

        let g = {
          id: game.id,
          date: get(game, 'competitions.0.date'),
          startTime,
          neutralSite,
          note,
          status: status,
          away: awayTeam,
          home: homeTeam,
          odds: {
            vegasLine: vegasLine ? vegasLine : '-',
            vegasTotal: vegasTotal ? vegasTotal : '-',
            vegasFave,
          },
          prediction,
          totalDiff,
          lineDiff,
          kpDiff,
          shFactor,
          hasSurplusThrees,
          surplusThreeDiff,
          halftimeAction,
          surplusTeam,
        };

        // Halftime Games with Surplus Threes 23=halftime
        if (hasSurplusThrees && status.id === '23') {
          htGames.push(g);

          // Pregame games with odds and kenpom
        } else if (status.state === 'pre' && addPre) {
          games.push(g);
          if (awayTeam.kenPom && homeTeam.kenPom) {
            if (awayTeam.kenPom.conf && !confs.includes(awayTeam.kenPom.conf)) {
              confs.push(awayTeam.kenPom.conf);
            }
            if (homeTeam.kenPom.conf && !confs.includes(homeTeam.kenPom.conf)) {
              confs.push(homeTeam.kenPom.conf);
            }
          }

          // Pregame games with no odds
        } else if (status.state === 'pre' && !addPre) {
          noOdds.push(g);

          // Ingame or postgame games
        } else if (status.state === 'in' || status.state === 'post') {
          inpostGames.push(g);
        }
      });
    }

    return {
      areAnyGamesLive,
      beforeParse: gamesData.length,
      error: false,
      gamesUrl,
      date: gamesDate,
      confs,
      totalGames: games.length,
      totalInPost: inpostGames.length,
      totalNoOdds: noOdds.length,
      nonMatches,
      games,
      noOdds,
      inpostGames,
      htGames,
    };
  } catch (err) {
    console.error(err);
    return {
      error: true,
      errorNote: err.message || 'no error message',
    };
  }
};

export default getGames;
