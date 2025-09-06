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

const getPolls = async ({ year }) => {
  const apiKey = process.env.CFB_DATA_API_KEY;

  const polls = await axios.get(`https://api.collegefootballdata.com/rankings`, {
    params: { year },
    headers: {
      'Authorization': `Bearer ${apiKey}`
    }
  });

  return polls.data;
}

const handler = async (req, res) => {
  const { method } = req;
  switch (method) {
    case 'GET':

      const year = parseInt(req.query.year) || 2025;

      let cache = await redisClient.get(`cfb-polls-cache-${year}`);
      if (cache) {
        return res.send({ type: 'redis', data: cache });
      }

      const polls = await getPolls({ year });
      redisClient.set(`cfb-polls-cache-${year}`, JSON.stringify(polls), { ex: CACHE_IN_SECONDS });
      res.send({ type: 'api', data: polls });

      break;
    default:
      res.setHeader('Allow', ['GET']);
      res.status(405).end(`Method ${method} not allowed yah heard`);
  }
};

export default handler;