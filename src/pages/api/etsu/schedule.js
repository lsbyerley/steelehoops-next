import { Redis } from '@upstash/redis';
import axios from 'axios';
import https from "https";
import * as cheerio from 'cheerio';

// 12 hour cache
const CACHE_IN_SECONDS = 43200;
const CACHE_NAME = 'etsu-schedule-cache'

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
    const scheduleList = $('ul.sidearm-schedule-games-container');

    const scheduleRecord = $('div.sidearm-schedule-record');

    // Initialize an array to store player data
    const schedule = [];

    // Iterate over each row (player) in the table
    scheduleList.find('li.sidearm-schedule-game').each((index, element) => {
      // Extract game information from each row
      const opponent = $(element).find('div.sidearm-schedule-game-opponent div.sidearm-schedule-game-opponent-name a').text().trim();
      const vsat = $(element).find('div.sidearm-schedule-game-opponent-text span.sidearm-schedule-game-conference-vs span').text().trim();
      const date = $(element).find('div.sidearm-schedule-game-opponent-date span:nth-child(1)').text().trim();
      const time = $(element).find('div.sidearm-schedule-game-opponent-date span:nth-child(2)').text().trim();
      const result = $(element).find('div.sidearm-schedule-game-details div.sidearm-schedule-game-result span:nth-child(2)').text().trim();
      const score = $(element).find('div.sidearm-schedule-game-details div.sidearm-schedule-game-result span:nth-child(3)').text().trim();
      const opponentLogo = $(element).find('div.sidearm-schedule-game-opponent-logo img').attr('data-src');
      
      // Create a player object and push it to the players array
      if (opponent !== '') {
        schedule.push({ opponent, vsat, date, time, result, score, opponentLogo });
      }
    });

    // Return the array of players
    return schedule;

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
        return res.send({ type: 'redis', schedule: cache });
      }

      const schedule = await scrapeSchedule('https://etsubucs.com/sports/mens-basketball/schedule');
      redisClient.set(CACHE_NAME, JSON.stringify(schedule), {
        ex: CACHE_IN_SECONDS,
      });
      res.send({ type: 'api', schedule });

      break;
    default:
      res.setHeader('Allow', ['GET']);
      res.status(405).end(`Method ${method} not allowed yah heard`);
  }
};

export default handler;