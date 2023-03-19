// import { NextApiRequest, NextApiResponse } from 'next';
import { Redis } from '@upstash/redis';
import https from 'https';
import getRatings from '../../lib/ratings';

// 1 hour cache
const CACHE_IN_SECONDS = 3600;

// https://docs.upstash.com/redis/sdks/javascriptsdk/advanced#keepalive
const redisClient = Redis.fromEnv({
  agent: new https.Agent({ keepAlive: true }),
});

const handler = async (req, res) => {
  const { method } = req;
  switch (method) {
    case 'GET':
      let cache = await redisClient.get('ratings-cache');
      if (cache) {
        return res.send({ type: 'redis', ...cache });
      }

      const ratings = await getRatings();
      redisClient.set('ratings-cache', JSON.stringify(ratings), {
        ex: CACHE_IN_SECONDS,
      });
      res.send({ type: 'api', ...ratings });

      break;
    default:
      res.setHeader('Allow', ['GET']);
      res.status(405).end(`Method ${method} not allowed yah heard`);
  }
};

export default handler;
