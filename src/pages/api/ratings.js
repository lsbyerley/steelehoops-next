// import { NextApiRequest, NextApiResponse } from 'next';
import getRatings from '../../lib/ratings';

const handler = async (req, res) => {
  const { method } = req;
  switch (method) {
    case 'GET':
      const ratings = await getRatings();
      res.send({ ratings });
      break;
    default:
      res.setHeader('Allow', ['GET']);
      res.status(405).end(`Method ${method} not allowed yah heard`);
  }
};

export default handler;
