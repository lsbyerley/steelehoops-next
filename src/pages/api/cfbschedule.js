// import { NextApiRequest, NextApiResponse } from 'next';
import { Redis } from "@upstash/redis";
import https from "https";
import axios from "axios";
// import getStats from '../../lib/stats';

// 5 day cache
const CACHE_IN_SECONDS = 432000; // 5 days

// https://docs.upstash.com/redis/sdks/javascriptsdk/advanced#keepalive
const redisClient = Redis.fromEnv({
  agent: new https.Agent({ keepAlive: true }),
});

const getSchedule = async ({ year, teams }) => {
  const apiKey = process.env.CFB_DATA_API_KEY;

  const schedule = await Promise.all(teams.map(async (team) => {
    const gamesRes = await axios.get(`https://api.collegefootballdata.com/games`, {
      params: { year, team },
      headers: {
        'Authorization': `Bearer ${apiKey}`
      }
    });
    return { team, games: gamesRes.data };
  }));

  return schedule;
}

const handler = async (req, res) => {
  const { method } = req;
  switch (method) {
    case 'POST':

      try {

        const year = parseInt(req.query.year) || 2025;
        const teams = req.body.teams || [];
        if (teams?.length === 0) {
          return res.status(400).json({ error: 'No teams provided' });
        }

        //Example key: cfb-schedule-cache-2025-Michigan-Arizona~State-South~Carolina-Georgia~Tech
        const cacheKey = `cfb-schedule-cache-${year}-${teams.join('-').replaceAll(' ', '~')}`;

        let cache = await redisClient.get(cacheKey);
        if (cache) {
          return res.send({ type: 'redis', data: cache });
        }

        const games = await getSchedule({ year, teams });
        await redisClient.set(cacheKey, JSON.stringify(games), { ex: CACHE_IN_SECONDS });
        res.send({ type: 'api', data: games });

      } catch (error) {
        console.error('Error fetching CFB schedule:', error);
        res.status(500).json({ error: 'Internal Server Error' });
      }

      break;
    default:
      res.setHeader('Allow', ['POST']);
      res.status(405).end(`Method ${method} not allowed`);
  }
};

export default handler;