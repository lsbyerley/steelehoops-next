import dayjs from 'dayjs';
// import axios from 'axios';
import * as cheerio from 'cheerio';
import cloudscraper from 'cloudscraper';
// const dynamodb = require('../utils/dynamodb');
const expireThreshold = 0; // 2hours

// TZ is aws lambda reserved env variable
const { TZ } = process.env;

let date = dayjs();
if (TZ === ':UTC') {
  date = date.subtract(5, 'hour'); // UTC offset -5 hours for EST
}

const getRatings = async () => {
  try {
    let ratingsFromDb = false;
    let minutesOld = 0;
    const ratingsKey = `Ratings-${date.format('YYYYMMDD')}`;
    const getItemParams = {
      TableName: 'SteeleHoops',
      Key: { KEY: ratingsKey },
    };

    let ratings = await scrape();

    return {
      error: false,
      minutesOld,
      ratingsFromDb,
      ratingsKey,
      ...ratings,
    };
  } catch (err) {
    console.error(err);
    return {
      error: true,
      errorNote: err.message || 'no error message',
    };
  }
};

async function updateRatingsInDB(ratingsKey, ratings) {
  const updateItemParams = {
    TableName: 'SteeleHoops',
    Key: { KEY: ratingsKey },
    UpdateExpression: 'set JSON_DATA = :jd, UPDATED_AT = :ua',
    ExpressionAttributeValues: {
      ':jd': ratings,
      ':ua': date.format('M/D/YYYY h:mm a'),
    },
  };
  return await dynamodb.update(updateItemParams).promise();
}

async function scrape() {
  const options = {
    uri: 'https://kenpom.com',
  };

  let ratingsRes = await cloudscraper.get(options);

  const $ = cheerio.load(ratingsRes);
  const ratings = $('table#ratings-table tbody tr') || [];
  let teamRatings = [];
  let totalTeams = 0;
  let totalTempo = 0;
  let totalEfficiency = 0;

  ratings.each((i, el) => {
    const tds = $(el).children();

    //USE toFixed() FOR DISPLAYING AFTER PARSING

    const offensiveEfficiency = parseFloat($(tds[5]).text().trim());
    const defensiveEfficiency = parseFloat($(tds[7]).text().trim());
    const tempo = parseFloat($(tds[9]).text().trim());

    const teamRating = {
      rank: $(tds[0]).text(),
      team: $(tds[1]).find('a').text().trim(),
      conf: $(tds[2]).find('a').text().trim(),
      record: $(tds[3]).text().trim(),
      adjEM: $(tds[4]).text().trim(),
      adjO: offensiveEfficiency,
      adjORank: $(tds[6]).find('.seed').text().trim(),
      adjD: defensiveEfficiency,
      adjDRank: $(tds[8]).find('.seed').text().trim(),
      adjT: tempo,
      adjTRank: $(tds[10]).find('.seed').text().trim(),
      //"luck": $(tds[11]).text().trim(),
      //"luckRank": $(tds[12]).find('.seed').text().trim(),
      sosAdjEM: $(tds[13]).text().trim(),
      sosAdjEMRank: $(tds[14]).find('.seed').text().trim(),
      //"sosOppO": $(tds[15]).text().trim(),
      //"sosOppORank": $(tds[16]).find('.seed').text().trim(),
      //"sosOppD": $(tds[17]).text().trim(),
      //"sosOppDRank": $(tds[18]).find('.seed').text().trim(),
      //"nonConfAdjEM": $(tds[19]).text().trim(),
      //"nonConfAdjEMRank": $(tds[20]).find('.seed').text().trim()
    };
    totalTeams += 1;
    totalTempo = totalTempo + tempo;
    totalEfficiency =
      totalEfficiency + (offensiveEfficiency + defensiveEfficiency) / 2;
    teamRatings.push(teamRating);
  });

  const avgTempo = parseFloat((totalTempo / totalTeams).toFixed(1));
  const avgEfficiency = parseFloat((totalEfficiency / totalTeams).toFixed(1));

  return {
    totalTeams,
    avgTempo,
    avgEfficiency,
    ratings: teamRatings,
  };
}

export default getRatings;
