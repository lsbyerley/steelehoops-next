// import { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';
import * as cheerio from 'cheerio';

const tableIds = [
  '#tablepress-2915',
  '#tablepress-2916',
  '#tablepress-2917',
  '#tablepress-2921',
  '#tablepress-2914',
  '#tablepress-2918',
  '#tablepress-2919',
  '#tablepress-2920',
  '#tablepress-2922',
  '#tablepress-2923',
];

async function scrape() {
  const url =
    'https://betiq.teamrankings.com/articles/college-football-rankings-predictions-2025/';
  const statsRes = await axios.get(url);

  const $ = cheerio.load(statsRes.data, { normalizeWhitespace: true });

  let rankings = [];
  tableIds.forEach((id) => {
    const tableRows = $(`table${id} tbody tr`) || [];

    tableRows.each((i, elem) => {
      let team = $(elem).find('td.column-1').text();
      let rating = $(elem).find('td.column-2').text();
      let wins = $(elem).find('td.column-4').text();
      let losses = $(elem).find('td.column-5').text();
      let confWins = $(elem).find('td.column-6').text();
      let confLosses = $(elem).find('td.column-7').text();
      let winConf = $(elem).find('td.column-8').text();

      if (team && rating !== 'Rating') {
        rankings.push({
          team,
          rating,
          wins,
          losses,
          confWins,
          confLosses,
          winConf,
          taken: false,
        })
      }
    });
  });

  const sorted = rankings.sort((a,b) => {
    let aWins = parseFloat(a.wins);
    let bWins = parseFloat(b.wins);
    if (aWins < bWins) {
      return 1;
    } else if (aWins > bWins) {
      return -1;
    }
    // a must be equal to b
    return 0;
  });

  /* const sorted = rankings.sort((a,b) => {
    let aRating = parseFloat(a.rating);
    let bRating = parseFloat(b.rating);
    if (aRating < bRating) {
      return 1;
    } else if (aRating > bRating) {
      return -1;
    }
    // a must be equal to b
    return 0;
  }); */

  return {
    rankings: sorted,
  };
}

const getRankings = async () => {
  const rankings = await scrape();
  return rankings;
};

const handler = async (req, res) => {
  const { method } = req;
  switch (method) {
    case 'GET':

      const rankings = await getRankings();
      res.send({ type: 'api', ...rankings });

      break;
    default:
      res.setHeader('Allow', ['GET']);
      res.status(405).end(`Method ${method} not allowed yah heard`);
  }
};

export default handler;