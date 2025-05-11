// src/pages/api/stock.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { z } from 'zod';
import { prisma } from '../../lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from './auth/[...nextauth]';

// 1) Définissez le schéma Zod
const StockSchema = z.object({
  name: z.string().min(1),
  quantity: z.number().int().nonnegative(),
  unit: z.string().min(1),
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);
  if (!session) {
    return res.status(401).json({ error: 'Non authentifié' });
  }

  try {
    if (req.method === 'GET') {
      // 2) GET → lister tous les stockItems
      const items = await prisma.stockItem.findMany();
      return res.status(200).json(items);
    }
    if (req.method === 'POST') {
      // 3) POST → valider et créer un nouvel item
      const data = StockSchema.parse(req.body);
      const item = await prisma.stockItem.create({ data });
      return res.status(201).json(item);
    }
    // 4) Méthodes non autorisées
    res.setHeader('Allow', ['GET','POST']);
    return res.status(405).end();
  } catch (err: any) {
    // 5) Gestion d'erreur
    return res.status(400).json({ error: err.message });
  }
}
