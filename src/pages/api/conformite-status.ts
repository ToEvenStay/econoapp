import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../lib/prisma';
import { verifyTokenServer } from '../../lib/auth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const user = verifyTokenServer(req);
  if (!user) {
    return res.status(401).json({ error: 'Non authentifié' });
  }
  if (req.method === 'GET') {
    // Liste tous les statuts
    const status = await prisma.conformiteStatus.findMany();
    return res.status(200).json(status);
  }
  if (req.method === 'POST') {
    // Ajout d'un statut
    const { label } = req.body;
    if (!label || typeof label !== 'string') return res.status(400).json({ error: 'Label requis' });
    try {
      const created = await prisma.conformiteStatus.create({ data: { label } });
      return res.status(201).json(created);
    } catch (err: any) {
      return res.status(400).json({ error: err.message });
    }
  }
  if (req.method === 'DELETE') {
    // Suppression d'un statut
    const { id } = req.query;
    if (!id || typeof id !== 'string') return res.status(400).json({ error: 'ID requis' });
    try {
      await prisma.conformiteStatus.delete({ where: { id } });
      return res.status(204).end();
    } catch (err: any) {
      return res.status(400).json({ error: err.message });
    }
  }
  res.setHeader('Allow', ['GET', 'POST', 'DELETE']);
  return res.status(405).end('Méthode non autorisée');
} 