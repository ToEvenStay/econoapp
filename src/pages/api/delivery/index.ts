import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../../lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);
  if (!session) {
    return res.status(401).json({ error: 'Non authentifié' });
  }

  try {
    // Bloc spécifique rapportBC EN PREMIER !
    if (req.method === 'GET' && req.query.rapportBC) {
      // Endpoint: /api/delivery?rapportBC=NUMBC
      const numBC = req.query.rapportBC as string;
      if (!numBC) return res.status(400).json({ error: 'numBC requis' });
      // Récupérer toutes les livraisons liées à ce numBC
      const livraisons = await prisma.livraison.findMany({
        where: { numBC },
        include: { articles: true }
      });
      // Agréger les quantités par référence d'article
      const rapport: Record<string, any> = {};
      for (const livraison of livraisons) {
        for (const article of livraison.articles) {
          if (!rapport[article.reference]) {
            rapport[article.reference] = {
              nom: article.nom,
              reference: article.reference,
              total: 0,
              bon: 0,
              litige: 0,
              back_order: 0,
              non_controle: 0,
              remarques: []
            };
          }
          rapport[article.reference].total += article.quantite;
          if (article.conformite === 'bon') rapport[article.reference].bon += article.quantite;
          if (article.conformite === 'litige') rapport[article.reference].litige += article.quantite;
          if (article.conformite === 'back_order') rapport[article.reference].back_order += article.quantite;
          if (article.conformite === 'non_controle') rapport[article.reference].non_controle += article.quantite;
          if (article.remarques) rapport[article.reference].remarques.push(article.remarques);
        }
      }
      return res.status(200).json({ livraisons, rapport: Object.values(rapport) });
    }

    // Bloc général GET ensuite
    if (req.method === 'GET') {
      try {
        // Filtres
        const {
          dateDebut,
          dateFin,
          fournisseurId,
          serviceId,
          conformite,
          q,
          numBCs
        } = req.query;

        // Construction du filtre Prisma
        const where: any = {};
        if (dateDebut && dateFin) {
          where.dateLivraison = {
            gte: new Date(dateDebut as string),
            lte: new Date(dateFin as string)
          };
        }
        if (fournisseurId) {
          where.fournisseurId = fournisseurId;
        }
        if (serviceId) {
          where.serviceId = serviceId;
        }
        if (conformite) {
          where.conformite = conformite;
        }
        if (q && typeof q === 'string' && q.trim() !== '') {
          where.OR = [
            { remarques: { contains: q, mode: 'insensitive' } },
            { numBC: { contains: q, mode: 'insensitive' } },
            { numBL: { contains: q, mode: 'insensitive' } },
            { fournisseur: { name: { contains: q, mode: 'insensitive' } } }
          ];
        }
        if (numBCs) {
          let bcList: string[] = [];
          if (typeof numBCs === 'string') {
            try {
              bcList = JSON.parse(numBCs);
            } catch {
              bcList = [numBCs];
            }
          } else if (Array.isArray(numBCs)) {
            bcList = numBCs;
          }
          where.numBC = { in: bcList };
        }

        const livraisons = await prisma.livraison.findMany({
          where,
          include: {
            fournisseur: true,
            service: true,
            articles: true
          },
          orderBy: [
            { dateLivraison: 'desc' },
            { heureArrivee: 'desc' }
          ]
        });
        return res.status(200).json(livraisons);
      } catch (error: any) {
        console.error('Erreur lors de la récupération des livraisons:', error);
        return res.status(500).json({ error: error.message });
      }
    }

    // POST
    if (req.method === 'POST') {
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

        // Vérifier les articles déjà livrés
        if (numBC) {
          // Récupérer le bon de commande d'origine pour avoir la quantité commandée
          const order = await prisma.order.findFirst({ where: { numBC } });
          let articlesBC: { reference: string, quantite: number }[] = [];
          if (order && Array.isArray(order.items)) {
            articlesBC = order.items.map((item: string) => {
              const [nom, refPart, qtePart] = item.split('|').map((s: string) => s.trim());
              const reference = refPart ? refPart.replace(/^Ref: ?/, '') : '';
              const quantite = qtePart ? Number(qtePart.replace(/^Qté: ?/, '')) : 0;
              return { reference, quantite };
            });
          }

          const existingLivraisons = await prisma.livraison.findMany({
            where: { numBC },
            include: { articles: true }
          });
          const existingArticles = existingLivraisons.reduce((acc: Record<string, any>, livraison: any) => {
            livraison.articles.forEach((article: any) => {
              if (!acc[article.reference]) {
                acc[article.reference] = {
                  total: 0,
                  bon: 0,
                  litige: 0,
                  back_order: 0,
                  non_controle: 0
                };
              }
              acc[article.reference].total += article.quantite;
              if (article.conformite === 'bon') acc[article.reference].bon += article.quantite;
              if (article.conformite === 'litige') acc[article.reference].litige += article.quantite;
              if (article.conformite === 'back_order') acc[article.reference].back_order += article.quantite;
              if (article.conformite === 'non_controle') acc[article.reference].non_controle += article.quantite;
            });
            return acc;
          }, {});

          // Vérifier chaque article de la nouvelle livraison
          for (const article of articles) {
            const existing = existingArticles[article.reference];
            // Récupérer la quantité commandée d'origine pour cet article
            const bc = articlesBC.find(a => a.reference === article.reference);
            const quantiteCommandee = bc ? bc.quantite : 0;
            const totalApresLivraison = (existing ? existing.total : 0) + Number(article.quantiteRecue);
            if (quantiteCommandee > 0 && totalApresLivraison > quantiteCommandee) {
              return res.status(400).json({
                error: `La quantité totale livrée pour "${article.nom}" dépasse la quantité commandée (${quantiteCommandee}).`
              });
            }
            // On n'empêche plus la livraison en 'conforme' si une partie était en litige
          }
        }

        // Calcul conformité globale
        let conf = 'conforme';
        if (Array.isArray(articles)) {
          if (articles.some((a: any) => a.conformite === 'litige')) conf = 'litige';
          if (articles.some((a: any) => a.conformite === 'back_order')) conf = conf === 'litige' ? 'litige, back_order' : 'back_order';
          if (articles.some((a: any) => a.conformite === 'non_controle')) conf = 'non_controle';
        }

        const livraison = await prisma.livraison.create({
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
                quantite: Number(a.quantiteRecue),
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
        return res.status(201).json(livraison);
      } catch (error: any) {
        console.error('Erreur lors de la création de la livraison:', error);
        return res.status(500).json({ error: error.message });
      }
    }

    // Méthode non autorisée
    res.setHeader('Allow', ['GET', 'POST']);
    return res.status(405).end('Méthode non autorisée');
  } catch (error: any) {
    console.error('Erreur globale:', error);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
}