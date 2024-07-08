import { Redis } from '@upstash/redis';
import axios from 'axios';
import https from "https";
import * as cheerio from 'cheerio';

// 12 hour cache
const CACHE_IN_SECONDS = 43200;
const CACHE_NAME = 'etsu-stats-cache'

// https://docs.upstash.com/redis/sdks/javascriptsdk/advanced#keepalive
const redisClient = Redis.fromEnv({
  agent: new https.Agent({ keepAlive: true }),
});

async function scrapeSchedule(url) {
  try {
    // Fetch HTML content of the page
    const response = await axios.get(url);
    const html = response.data;

    // Load HTML into Cheerio
    const $ = cheerio.load(html);

    // Select the roster table
    const statsTable = $('section#individual-averages table.sidearm-table');

    // Initialize an array to store player data
    const stats = [];

    const statsTableTrs = statsTable.find('tbody tr');

    // Iterate over each row (player) in the table
    statsTableTrs.each((index, element) => {
      // Skip the last team row
      if (index !== statsTableTrs.length -1) {
        // Extract player information from each row
        const name = $(element).find('td:nth-child(2) a').text().trim();
        const points = $(element).find('td:nth-child(14)').text().trim();
        const rebounds = $(element).find('td:nth-child(10)').text().trim();
        const assists = $(element).find('td:nth-child(11)').text().trim();
        
        // Create a player object and push it to the players array
        stats.push({ name, points, rebounds, assists });
      }
    });

    // Return the array of players
    return stats;

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
        return res.send({ type: 'redis', ...cache });
      }

      const stats = await scrapeSchedule('https://etsubucs.com/sports/mens-basketball/stats');
      redisClient.set(CACHE_NAME, JSON.stringify(stats), {
        ex: CACHE_IN_SECONDS,
      });
      res.send({ type: 'api', ...stats });

      break;
    default:
      res.setHeader('Allow', ['GET']);
      res.status(405).end(`Method ${method} not allowed yah heard`);
  }
};

export default handler;