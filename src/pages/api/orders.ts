import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from './auth/[...nextauth]';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);
  if (!session) {
    return res.status(401).json({ error: 'Non authentifié' });
  }

  try {
    // GET: liste ou détail
    if (req.method === 'GET') {
      const { id, fulfilled } = req.query;
      if (id) {
        // Détail d'une commande
        const order = await prisma.order.findUnique({
          where: { id: String(id) },
          include: { fournisseur: true, service: true }
        });
        if (!order) return res.status(404).json({ error: 'Commande non trouvée' });
        return res.status(200).json(order);
      }
      // Liste de toutes les commandes (optionnel: filtrage par fulfilled)
      const where: any = {};
      if (fulfilled === 'true') where.fulfilled = true;
      if (fulfilled === 'false') where.fulfilled = false;
      const orders = await prisma.order.findMany({
        where,
        include: { fournisseur: true, service: true },
        orderBy: [{ createdAt: 'desc' }]
      });
      return res.status(200).json(orders);
    }

    // POST: création
    if (req.method === 'POST') {
      const { fournisseurId, serviceId, items, numBC, destination } = req.body;
      if (!fournisseurId || !serviceId || !Array.isArray(items) || items.length === 0 || !numBC) {
        return res.status(400).json({ error: 'Champs obligatoires manquants.' });
      }
      const created = await prisma.order.create({
        data: { fournisseurId, serviceId, items, numBC, destination }
      });
      return res.status(201).json(created);
    }

    // PUT: modification
    if (req.method === 'PUT') {
      const { id, fournisseurId, serviceId, items, numBC, fulfilled, destination } = req.body;
      if (!id) return res.status(400).json({ error: 'ID manquant.' });
      const updated = await prisma.order.update({
        where: { id: String(id) },
        data: { fournisseurId, serviceId, items, numBC, fulfilled, destination },
      });
      return res.status(200).json(updated);
    }

    // DELETE: suppression
    if (req.method === 'DELETE') {
      const { id } = req.body;
      if (!id) return res.status(400).json({ error: 'ID manquant.' });
      await prisma.order.delete({ where: { id: String(id) } });
      return res.status(204).end();
    }

    res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
    return res.status(405).end('Méthode non autorisée');
  } catch (error: any) {
    console.error('Erreur API orders:', error);
    return res.status(500).json({ error: error.message || 'Erreur serveur' });
  }
}