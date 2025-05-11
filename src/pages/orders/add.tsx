import React, { useState } from 'react';
import useSWR from 'swr';
import { useRouter } from 'next/router';
import HeaderLayout from '../../components/HeaderLayout';

const fetcher = (url: string) => fetch(url).then(r => r.json());

export default function AddOrderPage() {
  const router = useRouter();
  const { data: fournisseurs = [] } = useSWR('/api/fournisseurs', fetcher);
  const { data: services = [] } = useSWR('/api/services', fetcher);
  const [form, setForm] = useState({
    numBC: '',
    fournisseurId: '',
    serviceId: '',
    destination: '',
    items: [{ nom: '', reference: '', quantite: '' }],
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  }
  function handleItemChange(i: number, e: React.ChangeEvent<HTMLInputElement>) {
    setForm(f => ({ ...f, items: f.items.map((a, j) => j === i ? { ...a, [e.target.name]: e.target.value } : a) }));
  }
  function addItem() {
    setForm(f => ({ ...f, items: [...f.items, { nom: '', reference: '', quantite: '' }] }));
  }
  function removeItem(i: number) {
    setForm(f => ({ ...f, items: f.items.filter((_, j) => j !== i) }));
  }
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess(false);
    if (!form.numBC || !form.fournisseurId || !form.serviceId || form.items.some(a => !a.nom || !a.quantite)) {
      setError('Merci de remplir tous les champs obligatoires.');
      setLoading(false);
      return;
    }
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          numBC: form.numBC,
          fournisseurId: form.fournisseurId,
          serviceId: form.serviceId,
          destination: form.destination,
          items: form.items.map(a => `${a.nom} | Ref: ${a.reference} | Qté: ${a.quantite}`),
        })
      });
      if (!res.ok) throw new Error((await res.json()).error || 'Erreur serveur');
      setSuccess(true);
      setTimeout(() => router.push('/orders/incoming'), 1200);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <HeaderLayout>
      <div className="max-w-2xl mx-auto px-4 py-10">
        <div className="mb-8 flex items-center gap-4">
          <h1 className="text-3xl font-extrabold text-orange-500 tracking-tight">Nouveau bon de commande</h1>
        </div>
        <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl p-8 border border-gray-200 dark:border-gray-800 space-y-8">
          <div className="mb-4">
            <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wider">Numéro du bon de commande *</label>
            <input type="text" name="numBC" value={form.numBC} onChange={handleChange} required className="w-full rounded-lg border-gray-300 dark:bg-gray-800 dark:text-white focus:ring-2 focus:ring-orange-500" />
          </div>
          <div className="mb-4">
            <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wider">Destination</label>
            <input type="text" name="destination" value={form.destination} onChange={handleChange} className="w-full rounded-lg border-gray-300 dark:bg-gray-800 dark:text-white focus:ring-2 focus:ring-orange-500" placeholder="Ex : Nom de la personne, service, etc." />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wider">Fournisseur *</label>
              <select name="fournisseurId" value={form.fournisseurId} onChange={handleChange} required className="w-full rounded-lg border-gray-300 dark:bg-gray-800 dark:text-white focus:ring-2 focus:ring-orange-500">
                <option value="">Sélectionner</option>
                {fournisseurs.map((f: any) => <option key={f.id} value={f.id}>{f.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wider">Service *</label>
              <select name="serviceId" value={form.serviceId} onChange={handleChange} required className="w-full rounded-lg border-gray-300 dark:bg-gray-800 dark:text-white focus:ring-2 focus:ring-orange-500">
                <option value="">Sélectionner</option>
                {services.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
          </div>
          {/* Articles dynamiques */}
          <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">Articles</h2>
              <button type="button" onClick={addItem} className="bg-orange-500 text-white px-3 py-1 rounded hover:bg-orange-600 text-sm">Ajouter un article</button>
            </div>
            <div className="space-y-4">
              {form.items.map((a, i) => (
                <div key={i} className="grid grid-cols-1 md:grid-cols-4 gap-2 bg-white dark:bg-gray-900 p-3 rounded-lg border border-gray-100 dark:border-gray-800">
                  <input type="text" name="nom" value={a.nom} onChange={e => handleItemChange(i, e)} placeholder="Nom *" required className="rounded-lg border-gray-300 dark:bg-gray-800 dark:text-white" />
                  <input type="text" name="reference" value={a.reference} onChange={e => handleItemChange(i, e)} placeholder="Référence" className="rounded-lg border-gray-300 dark:bg-gray-800 dark:text-white" />
                  <input type="number" name="quantite" value={a.quantite} onChange={e => handleItemChange(i, e)} placeholder="Qté *" required min="0" step="0.01" className="rounded-lg border-gray-300 dark:bg-gray-800 dark:text-white" />
                  <button type="button" onClick={() => removeItem(i)} className="text-red-500 hover:text-red-700">Supprimer</button>
                </div>
              ))}
            </div>
          </div>
          {error && <div className="p-3 bg-red-100 text-red-700 rounded-lg text-center text-sm font-semibold">{error}</div>}
          {success && <div className="p-3 bg-green-100 text-green-700 rounded-lg text-center text-sm font-semibold">Bon de commande ajouté !</div>}
          <div className="flex justify-end gap-3 mt-4">
            <button type="button" onClick={() => router.push('/orders/incoming')} className="px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800">Annuler</button>
            <button type="submit" disabled={loading} className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-60 font-semibold">{loading ? 'Enregistrement…' : 'Enregistrer'}</button>
          </div>
        </form>
      </div>
    </HeaderLayout>
  );
} 