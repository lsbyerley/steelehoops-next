import axios from 'axios';
import * as cheerio from 'cheerio';
import { Redis } from '@upstash/redis';

// 12 hour cache
const CACHE_IN_SECONDS = 43200;

const redis = new Redis({
  url: process.env.UPSTASH_URL,
  token: process.env.UPSTASH_TOKEN,
});

const getStats = async () => {
  let cache = await redis.get('stats-cache');
  //cache = JSON.parse(cache);

  if (cache) {
    return {
      type: 'redis',
      ...cache,
    };
  } else {
    let stats = await scrape();
    redis.set('stats-cache', JSON.stringify(stats), { ex: CACHE_IN_SECONDS });

    return {
      type: 'api',
      ...stats,
    };
  }
};

async function scrape() {
  const url =
    'https://www.sports-reference.com/cbb/seasons/2023-school-stats.html';
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
