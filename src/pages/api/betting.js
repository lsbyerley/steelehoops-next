// import { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';
import * as cheerio from 'cheerio';

async function scrape() {
  const url = 'https://www.sportsbookreview.com/betting-odds/college-football/';
  const oddsRes = await axios.get(url);
  const $ = cheerio.load(oddsRes.data, { normalizeWhitespace: true });
  let odds = [];

  const gameSections = $('section#section-ncaaf');
  gameSections.each((i, elem) => {
    const gameRows = $(elem).find('div[class*="GameRows_eventMarketGridContainer"]');
    gameRows.each((i, elem) => {
      const timeColumn = $(elem).find('div[class*="GameRows_compactBettingOption"]');
      const participants = $(elem).find('span[class*="GameRows_participantBox"]');
      const awayTeam = $(participants[0]).text();
      const homeTeam = $(participants[1]).text();

      odds.push({
        time: '',
        game: `${awayTeam} @ ${homeTeam}`,
      });
    });
  });

  return {
    odds,
  };
}

const getOdds = async () => {
  const odds = await scrape();
  return odds;
};

const handler = async (req, res) => {
  const { method } = req;
  switch (method) {
    case 'GET':
      const odds = await getOdds();
      res.send({ type: 'api', ...odds });

      break;
    default:
      res.setHeader('Allow', ['GET']);
      res.status(405).end(`Method ${method} not allowed yah heard`);
  }
};

export default handler;
