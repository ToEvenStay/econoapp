import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../../lib/prisma';
import { verifyTokenServer } from '../../../lib/auth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const user = verifyTokenServer(req);
  if (!user) {
    return res.status(401).json({ error: 'Non authentifié' });
  }

  const { id } = req.query;
  if (typeof id !== 'string') {
    return res.status(400).json({ message: 'ID invalide' });
  }

  if (req.method === 'GET') {
    // Détail d'une livraison
    try {
      const livraison = await prisma.livraison.findUnique({
        where: { id },
        include: {
          fournisseur: true,
          service: true,
          articles: true
        }
      });
      if (!livraison) return res.status(404).json({ error: 'Livraison non trouvée' });
      return res.status(200).json(livraison);
    } catch (error: any) {
      return res.status(400).json({ error: error.message });
    }
  }

  if (req.method === 'PUT') {
    // Edition d'une livraison (remplace aussi les articles)
    try {
      const {
        fournisseurId,
        serviceId,
        dateLivraison,
        heureArrivee,
        numBC,
        numBL,
        type,
        tempFrais,
        tempCongele,
        conformite,
        remarques,
        articles
      } = req.body;
      if (!fournisseurId || !serviceId || !dateLivraison || !heureArrivee || !type || !conformite) {
        return res.status(400).json({ error: 'Champs obligatoires manquants' });
      }
      // Suppression des anciens articles puis recréation
      await prisma.articleLivraison.deleteMany({ where: { livraisonId: id } });
      // Calcul conformité globale
      let conf = 'conforme';
      if (Array.isArray(articles)) {
        if (articles.some((a: any) => a.conformite === 'litige')) conf = 'litige';
        if (articles.some((a: any) => a.conformite === 'back_order')) conf = conf === 'litige' ? 'litige, back_order' : 'back_order';
        if (articles.some((a: any) => a.conformite === 'non_controle')) conf = 'non_controle';
      }
      const livraison = await prisma.livraison.update({
        where: { id },
        data: {
          fournisseurId,
          serviceId,
          dateLivraison: new Date(dateLivraison),
          heureArrivee,
          numBC,
          numBL,
          type,
          tempFrais: tempFrais !== undefined ? Number(tempFrais) : undefined,
          tempCongele: tempCongele !== undefined ? Number(tempCongele) : undefined,
          conformite: conf,
          remarques,
          articles: {
            create: Array.isArray(articles) ? articles.map((a: any) => ({
              nom: a.nom,
              quantite: Number(a.quantite),
              reference: a.reference,
              conformite: a.conformite,
              remarques: a.remarques
            })) : []
          }
        },
        include: {
          fournisseur: true,
          service: true,
          articles: true
        }
      });
      return res.status(200).json(livraison);
    } catch (error: any) {
      return res.status(400).json({ error: error.message });
    }
  }

  if (req.method === 'DELETE') {
    // Suppression d'une livraison et de ses articles
    try {
      await prisma.articleLivraison.deleteMany({ where: { livraisonId: id } });
      await prisma.livraison.delete({ where: { id } });
      return res.status(204).end();
    } catch (error: any) {
      return res.status(400).json({ error: error.message });
    }
  }

  return res.status(405).json({ message: 'Méthode non autorisée' });
} 