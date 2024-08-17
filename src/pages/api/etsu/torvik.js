import { Redis } from '@upstash/redis';
import axios from 'axios';
import https from "https";
import * as cheerio from 'cheerio';

// 12 hour cache
const CACHE_IN_SECONDS = 43200;
const CACHE_NAME = 'etsu-torvik-cache'

// https://docs.upstash.com/redis/sdks/javascriptsdk/advanced#keepalive
const redisClient = Redis.fromEnv({
  agent: new https.Agent({ keepAlive: true }),
});

async function scrapeTorvik(url) {
  try {
    // Fetch HTML content of the page
    const response = await axios.get(url);
    const html = response.data;

    // Load HTML into Cheerio
    const $ = cheerio.load(html);

    // Select the torvik table
    const torvikScheduleTable = $('div.teamFour table.skedtable');
    const torvikStatsTable = $('div.teamFive div#tble table');

    // Initialize an array to store player data
    const schedule = [];
    const stats = [];

    const scheduleTableTrs = torvikScheduleTable.find('tbody tr');
    const statsTableTrs = torvikStatsTable.find('tbody tr');

    // Iterate over each row (player) in the table
    scheduleTableTrs.each((index, element) => {
      // Extract player information from each row
      const opponent = $(element).find('td:nth-child(6) a').text().trim();
      const homeAway = $(element).find('td:nth-child(2)').text().trim();
      const date = $(element).find('td:nth-child(2)').text().trim();
      const time = $(element).find('td:nth-child(2)').text().trim();
      const result = $(element).find('td:nth-child(2)').text().trim();
      const score = $(element).find('td:nth-child(2)').text().trim();
      const opponentLogo = $(element).find('div.sidearm-schedule-game-opponent-logo img').attr('data-src');
      
      // Create a player object and push it to the schedule array
      schedule.push({ opponent, homeAway, date, time, result, score, opponentLogo });
    });

    statsTableTrs.each((index, element) => {

      const player = $(element).find('td:nth-child(5) a').text().trim();
      const ratingPg = $(element).find('td:nth-child(7)').text().trim();

      stats.push({ player, ratingPg })
    });

    // Return the array of schedule
    return { schedule, stats };

  } catch (error) {
    console.error('Error fetching or parsing data:', error);
    return null;
  }
}

const handler = async (req, res) => {
  const { method } = req;
  switch (method) {
    case 'GET':
      // let cache = await redisClient.get(CACHE_NAME);
      // if (cache) {
      //   return res.send({ type: 'redis', torvik: cache });
      // }

      const torvik = await scrapeTorvik('https://barttorvik.com/team.php?year=2024&team=East+Tennessee+St.');
      redisClient.set(CACHE_NAME, JSON.stringify(torvik), {
        ex: CACHE_IN_SECONDS,
      });
      res.send({ type: 'api', torvik });

      break;
    default:
      res.setHeader('Allow', ['GET']);
      res.status(405).end(`Method ${method} not allowed yah heard`);
  }
};

export default handler;