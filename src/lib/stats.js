import axios from 'axios';
import * as cheerio from 'cheerio';

const getStats = async () => {
  const stats = await scrape();
  return stats;
};

async function scrape() {
  const url = 'https://www.sports-reference.com/cbb/seasons/men/2025-school-stats.html';

  try {
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
      const team = $(elem).find('td[data-stat="school_name"] a').text();
      const fg3_pct = $(elem).find('td[data-stat="fg3_pct"]').text();

      if (team) {
        stats.push({
          team,
          fg3_pct: fg3_pct ? fg3_pct : '0',
        });
      }
    });

    stats?.sort((a, b) => {
      return parseFloat(b.fg3_pct) - parseFloat(a.fg3_pct);
    });

    return {
      stats: stats,
    };
  } catch (err) {
    return {
      stats: [],
      error: err,
    };
  }
}

export default getStats;
