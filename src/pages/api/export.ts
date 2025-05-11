import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../lib/prisma';
import PDFDocument from 'pdfkit';

export const config = {
  api: {
    responseLimit: false,
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { type } = req.query;
  let data: any[] = [];
  let title = '';
  if (type === 'users') {
    data = await prisma.user.findMany();
    title = 'Liste des utilisateurs';
  } else if (type === 'services') {
    data = await prisma.service.findMany();
    title = 'Liste des services';
  } else if (type === 'fournisseurs') {
    data = await prisma.fournisseur.findMany();
    title = 'Liste des fournisseurs';
  } else {
    return res.status(400).json({ error: 'Type invalide' });
  }

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${type}.pdf"`);

  const doc = new PDFDocument();
  doc.pipe(res);
  doc.fontSize(18).text(title, { align: 'center' });
  doc.moveDown();
  data.forEach((item, i) => {
    const { id, ...rest } = item;
    doc.fontSize(12).text(`${i + 1}. ${Object.values(rest).join(' | ')}`);
  });
  doc.end();
} 