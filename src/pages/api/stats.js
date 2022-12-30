// import { NextApiRequest, NextApiResponse } from 'next';
import getStats from '../../lib/stats';

const handler = async (req, res) => {
  const { method } = req;
  switch (method) {
    case 'GET':
      const stats = await getStats();
      res.send({ stats });
      break;
    default:
      res.setHeader('Allow', ['GET']);
      res.status(405).end(`Method ${method} not allowed yah heard`);
  }
};

export default handler;
