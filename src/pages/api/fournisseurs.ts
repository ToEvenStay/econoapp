import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../lib/prisma';
import formidable from 'formidable';
import fs from 'fs';
import path from 'path';

export const config = {
  api: {
    bodyParser: false,
  },
};

const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'fournisseurs');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

async function parseForm(req: NextApiRequest) {
  return new Promise<{ fields: formidable.Fields; files: formidable.Files }>((resolve, reject) => {
    const form = formidable({ multiples: false, uploadDir, keepExtensions: true });
    form.parse(req, (err, fields, files) => {
      if (err) reject(err);
      else resolve({ fields, files });
    });
  });
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    // Liste tous les fournisseurs
    const fournisseurs = await prisma.fournisseur.findMany();
    return res.status(200).json(fournisseurs);
  }
  if (req.method === 'POST') {
    // Ajout d'un fournisseur (avec ou sans logo)
    try {
      const { fields, files } = await parseForm(req);
      const { name, email, phone, address, type } = fields;
      let logo = null;
      if (files.logo && Array.isArray(files.logo) === false) {
        const file = files.logo as formidable.File;
        logo = '/uploads/fournisseurs/' + path.basename(file.filepath);
      }
      const fournisseur = await prisma.fournisseur.create({
        data: {
          name: String(name),
          email: email ? String(email) : undefined,
          phone: phone ? String(phone) : undefined,
          address: address ? String(address) : undefined,
          type: Array.isArray(type) ? type[0] : type,
          logo,
        },
      });
      return res.status(201).json(fournisseur);
    } catch (err: any) {
      return res.status(400).json({ error: err.message });
    }
  }
  if (req.method === 'PUT') {
    // Edition d'un fournisseur (avec ou sans nouveau logo)
    try {
      const { fields, files } = await parseForm(req);
      const { id, name, email, phone, address, type } = fields;
      const fournisseurId = Array.isArray(id) ? id[0] : id;
      let logo = undefined;
      if (files.logo && Array.isArray(files.logo) === false) {
        const file = files.logo as formidable.File;
        logo = '/uploads/fournisseurs/' + path.basename(file.filepath);
      }
      const data: any = {
        name: String(name),
        email: email ? String(email) : undefined,
        phone: phone ? String(phone) : undefined,
        address: address ? String(address) : undefined,
        type: Array.isArray(type) ? type[0] : type,
      };
      if (logo) data.logo = logo;
      const fournisseur = await prisma.fournisseur.update({
        where: { id: String(fournisseurId) },
        data,
      });
      return res.status(200).json(fournisseur);
    } catch (err: any) {
      return res.status(400).json({ error: err.message });
    }
  }
  if (req.method === 'DELETE') {
    // Suppression d'un fournisseur
    try {
      const { id } = req.query;
      if (!id || typeof id !== 'string') return res.status(400).json({ error: 'ID manquant' });
      await prisma.fournisseur.delete({ where: { id } });
      return res.status(204).end();
    } catch (err: any) {
      return res.status(400).json({ error: err.message });
    }
  }
  res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
  return res.status(405).end('Méthode non autorisée');
} 