// import { NextApiRequest, NextApiResponse } from 'next';
import getGames from '../../lib/games';

const handler = async (req, res) => {
  const { method } = req;

  /* res.setHeader(
    'Cache-Control',
    'public, s-maxage=60, stale-while-revalidate=599'
  ); */

  switch (method) {
    case 'GET':
      const date = req.query?.date;
      const games = await getGames(date);
      res.send(games);
      break;
    default:
      res.setHeader('Allow', ['GET']);
      res.status(405).end(`Method ${method} not allowed yah heard`);
  }
};

export default handler;
