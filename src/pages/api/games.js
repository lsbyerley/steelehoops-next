// import { NextApiRequest, NextApiResponse } from 'next';
import { Redis } from '@upstash/redis';
import https from 'https';
import axios from 'axios';
import getGames from '../../lib/games';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

// 2 minute cache
const CACHE_IN_SECONDS = 120;

// https://docs.upstash.com/redis/sdks/javascriptsdk/advanced#keepalive
const redisClient = Redis.fromEnv({
  agent: new https.Agent({ keepAlive: true }),
});

const handler = async (req, res) => {
  const { method } = req;

  switch (method) {
    case 'GET':
      const { data: teamRatings } = await axios.get(`${siteUrl}/api/ratings`);
      const { data: teamStats } = await axios.get(`${siteUrl}/api/stats`);

      const date = req.query?.date;
      const groupId = req.query?.groupId || 50;
      const cacheSlug = date ? `games-cache-${groupId}-${date}` : `games-cache-${groupId}`;

      let cache = await redisClient.get(cacheSlug);
      if (cache) {
        return res.send({ type: 'redis', ...cache });
      }

      const games = await getGames(date, teamRatings, teamStats, groupId);
      redisClient.set(cacheSlug, JSON.stringify(games), {
        ex: CACHE_IN_SECONDS,
      });
      res.send({ type: 'api', ...games });

      break;
    default:
      res.setHeader('Allow', ['GET']);
      res.status(405).end(`Method ${method} not allowed yah heard`);
  }
};

export default handler;
