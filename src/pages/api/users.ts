import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    // Liste tous les utilisateurs
    try {
      const users = await prisma.user.findMany({ orderBy: { email: 'asc' } });
      return res.status(200).json(users);
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }
  if (req.method === 'POST') {
    // Ajoute un utilisateur
    try {
      const { email, name } = req.body;
      if (!email || typeof email !== 'string') {
        return res.status(400).json({ error: 'Email requis' });
      }
      const user = await prisma.user.create({ data: { email, name } });
      return res.status(201).json(user);
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }
  if (req.method === 'DELETE') {
    // Supprime un utilisateur par id
    try {
      const { id } = req.body;
      if (!id || typeof id !== 'string') {
        return res.status(400).json({ error: 'ID requis' });
      }
      await prisma.user.delete({ where: { id } });
      return res.status(204).end();
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }
  if (req.method === 'PUT') {
    // Modifie un utilisateur (nom, email, accès)
    try {
      const { id, name, email, access } = req.body;
      if (!id || typeof id !== 'string') {
        return res.status(400).json({ error: 'ID requis' });
      }
      const user = await prisma.user.update({
        where: { id },
        data: {
          ...(name !== undefined ? { name } : {}),
          ...(email !== undefined ? { email } : {}),
          ...(access !== undefined ? { access } : {}),
        },
      });
      return res.status(200).json(user);
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }
  res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
  return res.status(405).end('Méthode non autorisée');
} 