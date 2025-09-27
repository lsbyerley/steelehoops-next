// import { NextApiRequest, NextApiResponse } from 'next';
import { Redis } from "@upstash/redis";
import https from "https";
import getStats from '../../lib/stats';

// 12 hour cache
const CACHE_IN_SECONDS = 43200;

// https://docs.upstash.com/redis/sdks/javascriptsdk/advanced#keepalive
const redisClient = Redis.fromEnv({
  agent: new https.Agent({ keepAlive: true }),
});

const handler = async (req, res) => {
  const { method } = req;
  switch (method) {
    case 'GET':

      let cache = await redisClient.get('stats-cache');
      if (cache) {
        return res.send({ type: 'redis', ...cache })
      }

      const stats = await getStats();
      await redisClient.set('stats-cache', JSON.stringify(stats), { ex: CACHE_IN_SECONDS });
      res.send({ type: 'api', ...stats });

      break;
    default:
      res.setHeader('Allow', ['GET']);
      res.status(405).end(`Method ${method} not allowed yah heard`);
  }
};

export default handler;
