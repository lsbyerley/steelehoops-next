import dayjs from 'dayjs';
import axios from 'axios';
import * as cheerio from 'cheerio';
// const dynamodb = require('../utils/dynamodb');
const expireThreshold = 0; // 2hours

// TZ is aws lambda reserved env variable
const { TZ } = process.env;

let date = dayjs();
if (TZ === ':UTC') {
  date = date.subtract(5, 'hour'); // UTC offset -5 hours for EST
}

const getStats = async () => {
  try {
    let stats = {};
    let statsFromDb = false;
    let minutesOld = 0;
    const statsKey = `Stats-${date.format('YYYYMMDD')}`;
    const getItemParams = {
      TableName: 'SteeleHoops',
      Key: { KEY: statsKey },
    };
    // const dbItem = await dynamodb.get(getItemParams).promise();
    const dbItem = {};

    // if we dont have any stats data for the KEY (aka date slug) get some
    if (!dbItem.Item) {
      stats = await scrape();
      // await updateStatsInDB(statsKey, stats);
    } else {
      // if we do have stats and they are older than the expire threshold, get fresh ones
      // else use the ones in the db

      const updatedAt = dayjs(dbItem.Item.UPDATED_AT);
      minutesOld = dayjs().diff(updatedAt, 'minute');

      if (Math.abs(minutesOld) > expireThreshold) {
        minutesOld = 0;
        stats = await scrape();
        // await updateStatsInDB(statsKey, stats);
      } else {
        statsFromDb = true;
        stats = dbItem.Item.JSON_DATA;
      }
    }

    return {
      error: false,
      minutesOld,
      statsFromDb,
      statsKey,
      ...stats,
    };
  } catch (err) {
    console.error(err);
    return {
      error: true,
      errorNote: err.message || 'no error message',
    };
  }
};

async function updateStatsInDB(statsKey, stats) {
  const updateItemParams = {
    TableName: 'SteeleHoops',
    Key: { KEY: statsKey },
    UpdateExpression: 'set JSON_DATA = :jd, UPDATED_AT = :ua',
    ExpressionAttributeValues: {
      ':jd': stats,
      ':ua': date.format('M/D/YYYY h:mm a'),
    },
  };
  return await dynamodb.update(updateItemParams).promise();
}

async function scrape() {
  const url =
    'https://www.sports-reference.com/cbb/seasons/2022-school-stats.html';
  const statsRes = await axios.get(url);

  const $ = cheerio.load(statsRes.data, { normalizeWhitespace: true });
  const statsDiv = $('#div_basic_school_stats');
  let rawHtml = statsDiv.html();
  rawHtml = rawHtml.replace('<!--', '');
  rawHtml = rawHtml.replace('-->', '');

  // TODO: needs updating with latest version of Cheerio https://github.com/cheeriojs/cheerio#loading
  // may need to install htmlparser2 or downgrade cheerio

  const statsDomNodes = cheerio.parseHTML(rawHtml);
  // console.log('LOG: here', statsDomNodes);
  const statRows = $(statsDomNodes).find('table#basic_school_stats tbody tr');

  let stats = [];
  statRows.each((i, elem) => {
    let team = $(elem).find('td[data-stat="school_name"] a').text();
    const fg3_pct = $(elem).find('td[data-stat="fg3_pct"]').text();

    if (team) {
      stats.push({
        team,
        fg3_pct: fg3_pct ? fg3_pct : '0',
      });
    }
  });

  return {
    stats: stats,
  };
}

export default getStats;
