import React, { useState, useEffect, Fragment } from 'react';
import useSWR from 'swr';
import { useRouter } from 'next/router';
import HeaderLayout from '@/components/HeaderLayout';
import { Dialog, Transition } from '@headlessui/react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faTrash } from '@fortawesome/free-solid-svg-icons';
import { useSession } from "next-auth/react";

const fetcher = (url: string) => fetch(url).then(r => r.json());

export default function EditDeliveryPage() {
  const { status } = useSession();
  const router = useRouter();
  const { id } = router.query;
  const { data: fournisseurs = [] } = useSWR('/api/fournisseurs', fetcher);
  const { data: services = [] } = useSWR('/api/services', fetcher);
  const { data: livraison, isLoading } = useSWR(id ? `/api/delivery/${id}` : null, fetcher);
  const [form, setForm] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  // Pour la suppression d'article
  const [articleToDelete, setArticleToDelete] = useState<number | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/api/auth/signin");
    }
  }, [status, router]);

  useEffect(() => {
    if (livraison) {
      setForm({
        fournisseurId: livraison.fournisseurId,
        serviceId: livraison.serviceId,
        dateLivraison: livraison.dateLivraison?.slice(0, 10) || '',
        heureArrivee: livraison.heureArrivee || '',
        numBC: livraison.numBC || '',
        numBL: livraison.numBL || '',
        type: livraison.type || 'alimentaire',
        tempFrais: livraison.tempFrais ?? '',
        tempCongele: livraison.tempCongele ?? '',
        conformite: livraison.conformite || 'conforme',
        remarques: livraison.remarques || '',
        articles: livraison.articles?.length ? livraison.articles.map((a: any) => ({
          nom: a.nom,
          quantite: a.quantite,
          reference: a.reference,
          conformite: a.conformite,
          remarques: a.remarques || ''
        })) : [{ nom: '', quantite: '', reference: '', conformite: 'conforme', remarques: '' }]
      });
    }
  }, [livraison]);

  // Calcul automatique de la conformité globale
  useEffect(() => {
    if (!form || !form.articles) return;
    let conf = 'conforme';
    if (form.articles.some((a: any) => a.conformite === 'litige')) conf = 'litige';
    if (form.articles.some((a: any) => a.conformite === 'back_order')) conf = conf === 'litige' ? 'litige, back_order' : 'back_order';
    if (form.articles.some((a: any) => a.conformite === 'non_controle')) conf = 'non_controle';
    setForm((f: any) => ({ ...f, conformite: conf }));
  }, [form?.articles]);

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
    setForm((f: any) => ({ ...f, [e.target.name]: e.target.value }));
  }
  function handleArticleChange(i: number, e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    setForm((f: any) => ({ ...f, articles: f.articles.map((a: any, j: number) => j === i ? { ...a, [e.target.name]: e.target.value } : a) }));
  }
  function addArticle() {
    setForm((f: any) => ({ ...f, articles: [...f.articles, { nom: '', quantite: '', reference: '', conformite: 'conforme', remarques: '' }] }));
  }
  function confirmRemoveArticle(i: number) {
    setArticleToDelete(i);
    setModalOpen(true);
  }
  function removeArticleConfirmed() {
    if (articleToDelete !== null) {
      setForm((f: any) => ({ ...f, articles: f.articles.filter((_: any, j: number) => j !== articleToDelete) }));
      setArticleToDelete(null);
      setModalOpen(false);
    }
  }
  function cancelRemoveArticle() {
    setArticleToDelete(null);
    setModalOpen(false);
  }

  // Validation quantité reçue et conformité obligatoire
  function validateArticles(articles: any[]) {
    for (const a of articles) {
      if (!a.quantiteRecue || Number(a.quantiteRecue) < 0 || !a.conformite) return false;
      if (a.conformite === 'conforme' && Number(a.quantiteRecue) !== Number(a.quantite)) return false;
    }
    return true;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess(false);
    if (!form.fournisseurId || !form.serviceId || !form.dateLivraison || !form.heureArrivee || !form.type || !form.conformite) {
      setError('Merci de remplir tous les champs obligatoires.');
      setLoading(false);
      return;
    }
    // Validation quantité reçue et conformité obligatoire
    if (!validateArticles(form.articles)) {
      setError('Merci de renseigner la quantité reçue ET la conformité pour chaque article. Si la quantité reçue diffère, la conformité ne peut pas être "conforme".');
      setLoading(false);
      return;
    }
    try {
      const res = await fetch(`/api/delivery/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          articles: form.articles.map((a: any) => ({ ...a, quantite: Number(a.quantite) }))
        })
      });
      if (!res.ok) throw new Error((await res.json()).error || 'Erreur serveur');
      setSuccess(true);
      setTimeout(() => router.push('/delivery/controle'), 1200);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  if (status === "loading") {
    return <div>Chargement...</div>;
  }

  if (isLoading || !form) {
    return <HeaderLayout><div className="max-w-3xl mx-auto px-4 py-10 text-center text-gray-400">Chargement…</div></HeaderLayout>;
  }

  return (
    <HeaderLayout>
      <div className="max-w-3xl mx-auto px-4 py-12">
        <div className="mb-10 flex items-center gap-4">
          <h1 className="text-4xl font-extrabold text-orange-500 tracking-tight leading-tight">Modifier la livraison</h1>
        </div>
        <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl p-10 border border-gray-100 dark:border-gray-800 space-y-12">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-widest">Fournisseur *</label>
              <select name="fournisseurId" value={form.fournisseurId} onChange={handleChange} required className="w-full rounded-xl border-gray-300 dark:bg-gray-800 dark:text-white focus:ring-2 focus:ring-orange-500 px-4 py-3 text-base">
                <option value="">Sélectionner</option>
                {fournisseurs.map((f: any) => <option key={f.id} value={f.id}>{f.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-widest">Service *</label>
              <select name="serviceId" value={form.serviceId} onChange={handleChange} required className="w-full rounded-xl border-gray-300 dark:bg-gray-800 dark:text-white focus:ring-2 focus:ring-orange-500 px-4 py-3 text-base">
                <option value="">Sélectionner</option>
                {services.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-widest">Date de livraison *</label>
              <input type="date" name="dateLivraison" value={form.dateLivraison} onChange={handleChange} required className="w-full rounded-xl border-gray-300 dark:bg-gray-800 dark:text-white focus:ring-2 focus:ring-orange-500 px-4 py-3 text-base" />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-widest">Heure d'arrivée *</label>
              <input type="time" name="heureArrivee" value={form.heureArrivee} onChange={handleChange} required className="w-full rounded-xl border-gray-300 dark:bg-gray-800 dark:text-white focus:ring-2 focus:ring-orange-500 px-4 py-3 text-base" />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-widest">Numéro BC</label>
              <input type="text" name="numBC" value={form.numBC} onChange={handleChange} className="w-full rounded-xl border-gray-300 dark:bg-gray-800 dark:text-white focus:ring-2 focus:ring-orange-500 px-4 py-3 text-base" />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-widest">Numéro BL</label>
              <input type="text" name="numBL" value={form.numBL} onChange={handleChange} className="w-full rounded-xl border-gray-300 dark:bg-gray-800 dark:text-white focus:ring-2 focus:ring-orange-500 px-4 py-3 text-base" />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-widest">Type *</label>
              <select name="type" value={form.type} onChange={handleChange} required className="w-full rounded-xl border-gray-300 dark:bg-gray-800 dark:text-white focus:ring-2 focus:ring-orange-500 px-4 py-3 text-base">
                <option value="alimentaire">Alimentaire</option>
                <option value="non_alimentaire">Non alimentaire</option>
              </select>
            </div>
            {form.type === 'alimentaire' && <>
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-widest">Température frais (°C)</label>
                <input type="number" name="tempFrais" value={form.tempFrais} onChange={handleChange} step="0.1" className="w-full rounded-xl border-gray-300 dark:bg-gray-800 dark:text-white focus:ring-2 focus:ring-orange-500 px-4 py-3 text-base" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-widest">Température congelé (°C)</label>
                <input type="number" name="tempCongele" value={form.tempCongele} onChange={handleChange} step="0.1" className="w-full rounded-xl border-gray-300 dark:bg-gray-800 dark:text-white focus:ring-2 focus:ring-orange-500 px-4 py-3 text-base" />
              </div>
            </>}
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-widest">Conformité *</label>
              <select name="conformite" value={form.conformite} onChange={handleChange} required className="w-full rounded-xl border-gray-300 dark:bg-gray-800 dark:text-white focus:ring-2 focus:ring-orange-500 px-4 py-3 text-base">
                <option value="conforme">Conforme</option>
                <option value="litige">Litige</option>
                <option value="back_order">Back Order</option>
                <option value="non_controle">Non contrôlé</option>
                <option value="autre">Autre</option>
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-widest">Remarques générales</label>
              <textarea name="remarques" value={form.remarques} onChange={handleChange} rows={2} className="w-full rounded-xl border-gray-300 dark:bg-gray-800 dark:text-white focus:ring-2 focus:ring-orange-500 px-4 py-3 text-base" />
            </div>
          </div>
          {/* Articles dynamiques */}
          <div className="bg-gray-50 dark:bg-gray-800 rounded-2xl p-8 border border-gray-100 dark:border-gray-800 shadow-xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Articles livrés</h2>
              <button type="button" onClick={addArticle} className="flex items-center gap-2 bg-orange-100 dark:bg-orange-900 text-orange-600 dark:text-orange-300 px-4 py-2 rounded-full font-semibold hover:bg-orange-200 dark:hover:bg-orange-800 transition text-sm shadow">
                <FontAwesomeIcon icon={faPlus} />
                Ajouter un article
              </button>
            </div>
            <div className="space-y-6">
              {form.articles.map((a: any, i: number) => (
                <div key={i} className="flex flex-col md:flex-row md:items-center gap-4 bg-white dark:bg-gray-900 p-5 rounded-2xl border border-gray-100 dark:border-gray-800 shadow hover:shadow-2xl transition">
                  <input type="text" name="nom" value={a.nom} onChange={e => handleArticleChange(i, e)} placeholder="Nom *" required className="flex-1 rounded-xl border-gray-300 dark:bg-gray-800 dark:text-white focus:ring-2 focus:ring-orange-500 px-4 py-3 text-base" />
                  <input type="number" name="quantite" value={a.quantite} onChange={e => handleArticleChange(i, e)} placeholder="Qté *" required min="0" step="0.01" className="w-32 rounded-xl border-gray-300 dark:bg-gray-800 dark:text-white focus:ring-2 focus:ring-orange-500 px-4 py-3 text-base" />
                  <input type="text" name="reference" value={a.reference} onChange={e => handleArticleChange(i, e)} placeholder="Référence *" required className="w-40 rounded-xl border-gray-300 dark:bg-gray-800 dark:text-white focus:ring-2 focus:ring-orange-500 px-4 py-3 text-base" />
                  <select name="conformite" value={a.conformite} onChange={e => handleArticleChange(i, e)} required className="w-40 rounded-xl border-gray-300 dark:bg-gray-800 dark:text-white focus:ring-2 focus:ring-orange-500 px-4 py-3 text-base">
                    <option value="conforme">Conforme</option>
                    <option value="litige">Litige</option>
                    <option value="back_order">Back Order</option>
                    <option value="non_controle">Non contrôlé</option>
                    <option value="autre">Autre</option>
                  </select>
                  <input type="text" name="remarques" value={a.remarques} onChange={e => handleArticleChange(i, e)} placeholder="Remarques" className="flex-1 rounded-xl border-gray-300 dark:bg-gray-800 dark:text-white focus:ring-2 focus:ring-orange-500 px-4 py-3 text-base" />
                  <button type="button" onClick={() => confirmRemoveArticle(i)} className="rounded-full bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-300 p-3 hover:bg-red-200 dark:hover:bg-red-800 transition shadow" title="Supprimer l'article">
                    <FontAwesomeIcon icon={faTrash} />
                  </button>
                </div>
              ))}
            </div>
          </div>
          {error && <div className="p-3 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 rounded-xl text-center text-sm font-semibold shadow">{error}</div>}
          {success && <div className="p-3 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 rounded-xl text-center text-sm font-semibold shadow">Livraison modifiée !</div>}
          <div className="flex justify-end gap-4 mt-6">
            <button type="button" onClick={() => router.push('/delivery/controle')} className="px-6 py-3 border border-gray-300 dark:border-gray-700 rounded-xl text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 font-semibold transition shadow">Annuler</button>
            <button type="submit" disabled={loading} className="px-6 py-3 bg-orange-500 text-white rounded-xl hover:bg-orange-600 disabled:opacity-60 font-bold shadow transition">{loading ? 'Enregistrement…' : 'Enregistrer'}</button>
          </div>
        </form>
      </div>
      {/* Modal de confirmation suppression article */}
      <Transition.Root show={modalOpen} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={cancelRemoveArticle}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100"
            leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black/40 transition-opacity" />
          </Transition.Child>
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100"
              leave="ease-in duration-200" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl p-8 max-w-sm w-full border border-gray-200 dark:border-gray-800">
                <Dialog.Title className="text-lg font-bold text-red-600 mb-4">Confirmer la suppression</Dialog.Title>
                <Dialog.Description className="mb-6 text-gray-700 dark:text-gray-200">Voulez-vous vraiment supprimer cet article ? Cette action est irréversible.</Dialog.Description>
                <div className="flex justify-end gap-3">
                  <button onClick={cancelRemoveArticle} className="px-4 py-2 border border-gray-300 dark:border-gray-700 rounded text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 font-semibold">Annuler</button>
                  <button onClick={removeArticleConfirmed} className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 font-semibold shadow">Supprimer</button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </Dialog>
      </Transition.Root>
    </HeaderLayout>
  );
} 