import { Redis } from '@upstash/redis';
import axios from 'axios';
import https from 'https';
import * as cheerio from 'cheerio';

// 12 hour cache
const CACHE_IN_SECONDS = 43200;
const CACHE_NAME = 'etsu-roster-cache';

// https://docs.upstash.com/redis/sdks/javascriptsdk/advanced#keepalive
const redisClient = Redis.fromEnv({
  agent: new https.Agent({ keepAlive: true }),
});

async function scrapeRoster(url) {
  try {
    // Fetch HTML content of the page
    const response = await axios.get(url);
    const html = response.data;

    // Load HTML into Cheerio
    const $ = cheerio.load(html);

    // Select the roster table
    const rosterList = $('ul.sidearm-roster-players');

    // Initialize an array to store player data
    const players = [];

    // Iterate over each row (player) in the table
    rosterList.find('li').each((index, element) => {
      // Extract player information from each row
      const name = $(element).find('div.sidearm-roster-player-name h3 a').text().trim();
      const position = $(element)
        .find('div.sidearm-roster-player-position span.text-bold')
        .text()
        .trim();
      const height = $(element).find('span.sidearm-roster-player-height').text().trim();
      const weight = $(element).find('span.sidearm-roster-player-weight').text().trim();
      const year = $(element)
        .find('span.sidearm-roster-player-academic-year:not(.hide-on-large)')
        .text()
        .trim();
      const headshot = $(element).find('div.sidearm-roster-player-image a img').attr('data-src');

      // Create a player object and push it to the players array
      players.push({ name, position, height, weight, year, headshot });
    });

    // Return the array of players
    return players;
  } catch (error) {
    console.error('Error fetching or parsing data:', error);
    return null;
  }
}

const handler = async (req, res) => {
  const { method } = req;
  switch (method) {
    case 'GET':
      let cache = await redisClient.get(CACHE_NAME);
      if (cache) {
        return res.send({ type: 'redis', roster: cache });
      }

      const roster = await scrapeRoster('https://etsubucs.com/sports/mens-basketball/roster');
      await redisClient.set(CACHE_NAME, JSON.stringify(roster), {
        ex: CACHE_IN_SECONDS,
      });
      res.send({ type: 'api', roster });

      break;
    default:
      res.setHeader('Allow', ['GET']);
      res.status(405).end(`Method ${method} not allowed yah heard`);
  }
};

export default handler;
