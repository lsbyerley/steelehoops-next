import get from 'just-safe-get';
import teams from './teams-confs';

const normalizeTeam = (obj) => {
  const teamId = parseInt(get(obj, 'team.id'));
  let rank = get(obj, 'curatedRank.current');
  if (rank === 99) {
    rank = '';
  }

  let teamObj = teams.find((t) => {
    return `${t.id}` === `${teamId}`;
  });

  let totalRecord = '',
    vsConfRecord = '',
    ahRecord = '';
  let records = get(obj, 'records');
  if (records) {
    let tr = records.find((r) => {
      return r.type === 'total';
    });
    if (tr) {
      totalRecord = get(tr, 'summary');
    }
    let vc = records.find((r) => {
      return r.type === 'vsconf';
    });
    if (vc) {
      vsConfRecord = get(vc, 'summary');
    }
    if (get(obj, 'homeAway') === 'away') {
      let ah = records.find((a) => {
        return a.type === 'road';
      });
      if (ah) {
        ahRecord = get(ah, 'summary');
      }
    } else if (get(obj, 'homeAway') === 'home') {
      let ah = records.find((h) => {
        return h.type === 'home';
      });
      if (ah) {
        ahRecord = get(ah, 'summary');
      }
    }
  }

  let ppg = '';
  let threePtAtt = '';
  let threePtMade = '';
  let hasESPNStats = false;
  let statistics = get(obj, 'statistics');

  if (statistics) {
    hasESPNStats = true;

    let avgPoints = statistics.find((s) => {
      return s.name === 'avgPoints';
    });
    if (avgPoints) {
      ppg = avgPoints.displayValue;
    }

    let att = statistics.find((s) => {
      return s.name === 'threePointFieldGoalsAttempted';
    });
    if (att) {
      threePtAtt = att.displayValue;
    }

    let made = statistics.find((s) => {
      return s.name === 'threePointFieldGoalsMade';
    });
    if (made) {
      threePtMade = made.displayValue;
    }
  }

  return {
    id: teamId,
    abbrev: get(obj, 'team.abbreviation'),
    name: get(obj, 'team.location'),
    kpName: teamObj ? teamObj.kpName : '',
    statName: teamObj ? teamObj.statName : '',
    shortName: get(obj, 'team.shortDisplayName'),
    nickname: get(obj, 'team.name'),
    logo: get(obj, 'team.logo'),
    confId: get(obj, 'team.conferenceId'),
    score: get(obj, 'score'),
    color: get(obj, 'team.color'),
    altColor: get(obj, 'team.alternateColor'),
    rank,
    totalRecord,
    vsConfRecord,
    ahRecord,
    ppg,
    hasESPNStats,
    threePtAtt,
    threePtMade,
  };
};

export default normalizeTeam;
