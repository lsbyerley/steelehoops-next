// import { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';
import * as cheerio from 'cheerio';

async function scrape() {
  const url = 'https://betiq.teamrankings.com/college-football/predictions/';
  const statsRes = await axios.get(url);

  const $ = cheerio.load(statsRes.data, { normalizeWhitespace: true });

  let rankings = [];
  $('table.tr-table.datatable tbody tr').each((i, elem) => {
    const cells = $(elem).find('td');
    const team = $(cells[2]).text();
    const rating = $(cells[0]).text();
    const wins = $(cells[5]).text();
    const losses = $(cells[6]).text();
    const confWins = $(cells[7]).text();
    const confLosses = $(cells[8]).text();
    const winConf = $(cells[11]).text();

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
      });
    }
  });

  const sorted = rankings.sort((a, b) => {
    let aWins = parseFloat(a.wins);
    let bWins = parseFloat(b.wins);
    if (aWins < bWins) {
      return 1;
    } else if (aWins > bWins) {
      return -1;
    }
    return 0;
  });

  return {
    rankings: sorted,
  };
}

const getPredictions = async () => {
  const predictions = await scrape();
  return predictions;
};

const handler = async (req, res) => {
  const { method } = req;
  switch (method) {
    case 'GET':
      const predictions = await getPredictions();
      res.send({ type: 'api', ...predictions });

      break;
    default:
      res.setHeader('Allow', ['GET']);
      res.status(405).end(`Method ${method} not allowed yah heard`);
  }
};

export default handler;
