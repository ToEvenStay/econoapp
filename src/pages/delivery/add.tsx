import React, { useState, Fragment, useEffect } from 'react';
import useSWR from 'swr';
import { useRouter } from 'next/router';
import HeaderLayout from '../../components/HeaderLayout';
import { Listbox, Dialog, Transition } from '@headlessui/react';
import { CheckIcon, ChevronUpDownIcon, ExclamationTriangleIcon, DocumentTextIcon, ChatBubbleLeftRightIcon, ArrowTrendingDownIcon, ArrowTrendingUpIcon, TrashIcon, CubeIcon, PlusIcon } from '@heroicons/react/24/solid';
import { isAuthenticatedClient } from '../../lib/auth';

const fetcher = (url: string) => fetch(url).then(r => r.json());

// Définir le type d'un article pour inclure les nouveaux champs
type ArticleForm = {
  nom: string;
  reference: string;
  quantite: string;
  quantiteRecue: string;
  conformite: string;
  remarques: string;
  quantiteRestante?: string;
  dejaBon?: number;
  dejaLitige?: number;
};

// Composant InputCard pour un champ stylé
function InputCard({ icon, label, children }: { icon: React.ReactNode, label: string, children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 bg-orange-50 dark:bg-gray-900/40 border-2 border-orange-200 dark:border-orange-700 rounded-xl shadow-sm px-4 py-3 mb-2 focus-within:border-orange-500 transition">
      <span className="text-orange-500 flex-shrink-0">{icon}</span>
      <div className="flex-1">
        <div className="text-xs font-semibold text-orange-700 dark:text-orange-300 mb-1">{label}</div>
        {children}
      </div>
    </div>
  );
}

// Composant SectionTitle pour harmoniser les titres de section
function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="text-xl font-extrabold text-orange-500 mb-4 mt-8 tracking-tight flex items-center gap-2">{children}</h2>;
}

// Composant SearchableListbox pour Headless UI avec recherche intégrée
function SearchableListbox({ options, value, onChange, placeholder, renderOption, renderValue, noneLabel }: {
  options: any[],
  value: string,
  onChange: (v: string) => void,
  placeholder?: string,
  renderOption: (option: any) => React.ReactNode,
  renderValue: (option: any) => React.ReactNode,
  noneLabel?: string
}) {
  const [query, setQuery] = useState('');
  const filtered = query
    ? options.filter(o =>
        (o.fournisseur?.toLowerCase() || '').includes(query.toLowerCase()) ||
        (o.numBC?.toLowerCase() || '').includes(query.toLowerCase()) ||
        (o.service?.toLowerCase() || '').includes(query.toLowerCase())
      )
    : options;
  return (
    <Listbox value={value} onChange={onChange} as={Fragment}>
      <div className="relative">
        <Listbox.Button className="w-full rounded-2xl bg-white/70 dark:bg-gray-900/60 border-2 border-orange-300 dark:border-orange-700 shadow-lg px-4 py-3 text-left flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-orange-400 transition">
          {value ? renderValue(options.find(o => o.id === value)) : <span className="text-gray-400">{placeholder}</span>}
          <ChevronUpDownIcon className="w-5 h-5 ml-auto text-orange-400" />
        </Listbox.Button>
        <Transition
          as={Fragment}
          leave="transition ease-in duration-100"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <Listbox.Options className="absolute z-20 mt-2 w-full rounded-2xl bg-white dark:bg-gray-900 shadow-2xl border-2 border-orange-200 dark:border-orange-700 py-2 max-h-72 overflow-auto focus:outline-none">
            <div className="px-3 pb-2 sticky top-0 bg-white dark:bg-gray-900 z-10">
              <input
                type="text"
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Rechercher..."
                className="w-full rounded-lg border border-orange-200 dark:border-orange-700 bg-white/80 dark:bg-gray-900/80 px-3 py-2 text-sm focus:ring-2 focus:ring-orange-400 focus:border-orange-400 mb-1"
              />
            </div>
            <Listbox.Option value="" className={({ active }) => `cursor-pointer select-none relative py-2 pl-10 pr-4 ${active ? 'bg-orange-100 dark:bg-gray-800' : ''}`}>
              {noneLabel || 'Aucun (saisie manuelle)'}
            </Listbox.Option>
            {filtered.length === 0 && (
              <div className="text-center text-gray-400 py-4">Aucun résultat</div>
            )}
            {filtered.map(option => (
              <Listbox.Option key={option.id} value={option.id} className={({ active }) => `cursor-pointer select-none relative py-2 pl-10 pr-4 ${active ? 'bg-orange-100 dark:bg-gray-800' : ''}`}>
                {({ selected }) => (
                  <>
                    {renderOption(option)}
                    {selected && <CheckIcon className="w-5 h-5 text-orange-500 absolute left-2 top-1/2 -translate-y-1/2" />}
                  </>
                )}
              </Listbox.Option>
            ))}
          </Listbox.Options>
        </Transition>
      </div>
    </Listbox>
  );
}

// Composant ArticleCard pour chaque ligne d'article
function ArticleCard({ article, index, onChange, onRemove }: {
  article: any,
  index: number,
  onChange: (i: number, e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void,
  onRemove: (i: number) => void
}) {
  return (
    <div className="relative bg-white/90 dark:bg-gray-900/80 rounded-2xl shadow-md border-2 border-orange-100 dark:border-orange-700 p-4 mb-3 flex flex-col md:flex-row md:items-center md:gap-2 group transition-all hover:shadow-lg">
      <input type="text" name="nom" value={article.nom} onChange={e => onChange(index, e)} placeholder="Nom *" required className="rounded-lg bg-orange-50 dark:bg-gray-800/60 border-none focus:ring-2 focus:ring-orange-400 dark:text-white px-2 py-1 w-full" />
      <input type="number" name="quantite" value={article.quantite} onChange={e => onChange(index, e)} placeholder="Qté à recevoir *" required min="0" step="0.01" className="rounded-lg bg-orange-50 dark:bg-gray-800/60 border-none focus:ring-2 focus:ring-orange-400 dark:text-white px-2 py-1 w-full" />
      <input type="number" name="quantiteRecue" value={article.quantiteRecue} onChange={e => onChange(index, e)} placeholder="Qté reçue *" required min="0" step="0.01" className="rounded-lg bg-orange-100 dark:bg-gray-800/80 border-none focus:ring-2 focus:ring-orange-400 dark:text-white px-2 py-1 w-full" />
      <input type="text" name="reference" value={article.reference} onChange={e => onChange(index, e)} placeholder="Référence *" required className="rounded-lg bg-orange-50 dark:bg-gray-800/60 border-none focus:ring-2 focus:ring-orange-400 dark:text-white px-2 py-1 w-full" />
      <Listbox value={article.conformite} onChange={v => onChange(index, { target: { name: 'conformite', value: v } } as any)}>
        <div className="relative">
          <Listbox.Button className="w-full rounded-lg bg-orange-50 dark:bg-gray-800/60 border-none focus:ring-2 focus:ring-orange-400 dark:text-white px-2 py-1 text-left flex items-center">
            <span className="flex items-center gap-1">
              {article.conformite === 'conforme' && <CheckIcon className="w-4 h-4 text-green-500" />}
              {article.conformite === 'litige' && <ExclamationTriangleIcon className="w-4 h-4 text-red-500" />}
              {article.conformite === 'back_order' && <CubeIcon className="w-4 h-4 text-yellow-500" />}
              {article.conformite === 'non_controle' && <ChevronUpDownIcon className="w-4 h-4 text-gray-500" />}
              {article.conformite === 'autre' && <ChevronUpDownIcon className="w-4 h-4 text-blue-500" />}
              <span>{article.conformite.charAt(0).toUpperCase() + article.conformite.slice(1)}</span>
            </span>
            <ChevronUpDownIcon className="w-4 h-4 ml-auto text-orange-400" />
          </Listbox.Button>
          <Listbox.Options className="absolute z-10 mt-1 w-full bg-white dark:bg-gray-900 shadow-lg max-h-40 rounded-lg py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none">
            <Listbox.Option value="conforme" className={({ active }) => `cursor-pointer select-none relative py-2 pl-8 pr-4 ${active ? 'bg-green-100 dark:bg-green-900' : ''}`}>Conforme</Listbox.Option>
            <Listbox.Option value="litige" className={({ active }) => `cursor-pointer select-none relative py-2 pl-8 pr-4 ${active ? 'bg-red-100 dark:bg-red-900' : ''}`}>Litige</Listbox.Option>
            <Listbox.Option value="back_order" className={({ active }) => `cursor-pointer select-none relative py-2 pl-8 pr-4 ${active ? 'bg-yellow-100 dark:bg-yellow-900' : ''}`}>Back Order</Listbox.Option>
            <Listbox.Option value="non_controle" className={({ active }) => `cursor-pointer select-none relative py-2 pl-8 pr-4 ${active ? 'bg-gray-100 dark:bg-gray-900' : ''}`}>Non contrôlé</Listbox.Option>
            <Listbox.Option value="autre" className={({ active }) => `cursor-pointer select-none relative py-2 pl-8 pr-4 ${active ? 'bg-blue-100 dark:bg-blue-900' : ''}`}>Autre</Listbox.Option>
          </Listbox.Options>
        </div>
      </Listbox>
      <input type="text" name="remarques" value={article.remarques} onChange={e => onChange(index, e)} placeholder="Remarques" className="rounded-lg bg-orange-50 dark:bg-gray-800/60 border-none focus:ring-2 focus:ring-orange-400 dark:text-white px-2 py-1 w-full md:flex-grow md:min-w-0" />
      <button type="button" aria-label="Supprimer l'article" onClick={() => onRemove(index)} className="top-2 right-2 md:static md:w-auto md:flex-shrink-0 md:ml-2 w-auto text-red-500 hover:text-red-700 p-1 rounded-full transition group-hover:bg-red-50 dark:group-hover:bg-red-900" title="Supprimer">
        <TrashIcon className="w-5 h-5" />
      </button>
    </div>
  );
}

export default function AddDeliveryPage() {
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticatedClient()) {
      router.push('/login');
    }
  }, [router]);

  const { data: fournisseurs = [] } = useSWR('/api/fournisseurs', fetcher);
  const { data: services = [] } = useSWR('/api/services', fetcher);
  const { data: orders = [], error: ordersError } = useSWR('/api/orders', fetcher, {
    refreshInterval: 3000, // Rafraîchir toutes les 3 secondes
    refreshWhenHidden: true,
    onErrorRetry: (error, key, config, revalidate, { retryCount }) => {
      if (retryCount >= 3) return false; // Arrêter après 3 tentatives
      return true;
    }
  });

  // Gestion des erreurs de chargement
  React.useEffect(() => {
    if (ordersError) {
      setError(`Erreur lors du chargement des commandes: ${ordersError.message}`);
      setLoading(false);
    }
  }, [ordersError]);
  const { data: livraisons = [] } = useSWR('/api/delivery', fetcher);

  // Initialisation automatique date/heure
  const now = new Date();
  const defaultDate = now.toISOString().slice(0, 10);
  const defaultTime = now.toTimeString().slice(0, 5);

  const [form, setForm] = useState({
    fournisseurId: '',
    serviceId: '',
    dateLivraison: defaultDate,
    heureArrivee: defaultTime,
    numBC: '',
    numBL: '',
    type: 'alimentaire',
    tempFrais: '',
    tempCongele: '',
    conformite: 'conforme',
    remarques: '',
    articles: [{ nom: '', quantite: '', quantiteRecue: '', reference: '', conformite: 'conforme', remarques: '', quantiteRestante: '', dejaBon: 0, dejaLitige: 0 } as ArticleForm]
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState('');
  const [bcSearch, setBcSearch] = useState('');
  // Dialog d'annulation
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);

  // DEBUG LOGS
  const selectedOrder = orders.find((o: any) => o.id === selectedOrderId);
  const numBCForRapport = selectedOrder?.numBC || form.numBC;
  const { data: rapportLivraisons, isLoading: loadingRapport, error: rapportError } = useSWR(numBCForRapport ? `/api/delivery?rapportBC=${encodeURIComponent(numBCForRapport)}` : null, fetcher, {
    refreshInterval: 3000, // Rafraîchir toutes les 3 secondes
    refreshWhenHidden: true,
    onErrorRetry: (error, key, config, revalidate, { retryCount }) => {
      if (retryCount >= 3) return false; // Arrêter après 3 tentatives
      return true;
    }
  });

  // Gestion des erreurs de rapport
  React.useEffect(() => {
    if (rapportError) {
      setError(`Erreur lors du chargement du rapport: ${rapportError.message}`);
      setLoading(false);
    }
  }, [rapportError]);

  // Lorsqu'on sélectionne un BC, on importe les infos
  React.useEffect(() => {
    if (!selectedOrderId) return;
    const order = orders.find((o: any) => o.id === selectedOrderId);
    
    if (!order) {
      setError('Commande non trouvée');
      setLoading(false);
      return;
    }

    // Correction UX : si pas de rapport, on continue avec un rapport vide
    const rapportOk = rapportLivraisons && Array.isArray(rapportLivraisons.rapport);
    const rapportData = rapportOk ? rapportLivraisons.rapport : [];

    setForm(prevForm => {
      const mapped: ArticleForm[] = order.items.map((item: any) => {
        if (!item || typeof item !== 'string') return { nom: '', reference: '', quantite: '', quantiteRecue: '', conformite: '', remarques: '', quantiteRestante: '', dejaBon: 0, dejaLitige: 0 };
        const [nom, refPart, qtePart] = item.split('|').map((s: string) => s.trim());
        const reference = refPart ? refPart.replace(/^Ref: ?/, '') : '';
        const quantite = qtePart ? qtePart.replace(/^Qté: ?/, '') : '';
        let dejaBon = 0, dejaLitige = 0;
        if (reference) {
          const rapport = rapportData.find((r: any) =>
            (r.reference === reference && r.nom === nom) ||
            (r.reference === reference) ||
            (r.nom === nom)
          );
          dejaBon = rapport?.bon || 0;
          dejaLitige = rapport?.litige || 0;
        }
        const quantiteRestante = quantite ? String(Math.max(Number(quantite) - dejaBon, 0)) : '';
        // Si tout est en litige, on laisse à 0, sinon on pré-remplit avec le restant
        let quantiteRecue = '';
        if (dejaBon === 0 && dejaLitige === Number(quantite)) {
          quantiteRecue = '';
        } else {
          quantiteRecue = quantiteRestante;
        }
        return {
          nom: nom || '',
          reference,
          quantite,
          quantiteRecue: String(quantiteRecue),
          conformite: '',
          remarques: '',
          quantiteRestante: String(quantiteRestante),
          dejaBon,
          dejaLitige
        };
      });
      return {
        ...prevForm,
        fournisseurId: order.fournisseurId || prevForm.fournisseurId,
        serviceId: order.serviceId || prevForm.serviceId,
        numBC: order.numBC || prevForm.numBC,
        articles: mapped
      };
    });
  }, [selectedOrderId, orders, rapportLivraisons]);

  // Calcul automatique de la conformité globale
  React.useEffect(() => {
    if (!form.articles) return;
    let conf = 'conforme';
    if (form.articles.some(a => a.conformite === 'litige')) conf = 'litige';
    if (form.articles.some(a => a.conformite === 'back_order')) conf = conf === 'litige' ? 'litige, back_order' : 'back_order';
    if (form.articles.some(a => a.conformite === 'non_controle')) conf = 'non_controle';
    setForm(f => ({ ...f, conformite: conf }));
  }, [form.articles]);

  // Fonction pour trouver la livraison liée à un BC
  function getLivraisonByNumBC(numBC: string) {
    return livraisons.find((l: any) => l.numBC === numBC);
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  }
  function handleArticleChange(i: number, e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    setForm(f => ({ ...f, articles: f.articles.map((a, j) => j === i ? { ...a, [e.target.name]: e.target.value } : a) }));
  }
  function addArticle() {
    setForm(f => ({ ...f, articles: [...f.articles, { nom: '', quantite: '', quantiteRecue: '', reference: '', conformite: 'conforme', remarques: '', quantiteRestante: '', dejaBon: 0, dejaLitige: 0 } as ArticleForm] }));
  }
  function removeArticle(i: number) {
    setForm(f => ({ ...f, articles: f.articles.filter((_, j) => j !== i) }));
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
    if (form.articles.some(a => !a.quantiteRecue || Number(a.quantiteRecue) < 0 || !a.conformite)) {
      setError('Merci de renseigner la quantité reçue ET la conformité pour chaque article.');
      setLoading(false);
      return;
    }

    // Validation supplémentaire des quantités reçues
    const validationErrors = form.articles.map((a, i) => {
      let dejaBon = 0, dejaLitige = 0, dejaTotal = 0;
      if (Array.isArray(rapportLivraisons?.rapport) && a.reference) {
        const rapport = rapportLivraisons.rapport.find((r: any) => r.reference === a.reference);
        dejaBon = rapport?.bon || 0;
        dejaLitige = rapport?.litige || 0;
        dejaTotal = dejaBon + dejaLitige;
      }
      const quantiteRestante = a.quantite ? String(Math.max(Number(a.quantite) - dejaTotal, 0)) : '';
      
      if (Number(a.quantiteRecue) > Number(quantiteRestante)) {
        return `L'article "${a.nom}" a une quantité reçue (${a.quantiteRecue}) supérieure à la quantité restante (${quantiteRestante}).`;
      }
      if (Number(a.quantiteRecue) > Number(a.quantite)) {
        return `L'article "${a.nom}" a une quantité reçue (${a.quantiteRecue}) supérieure à la quantité commandée (${a.quantite}).`;
      }
      return null;
    }).filter(e => e !== null);

    if (validationErrors.length > 0) {
      setError(validationErrors.join('\n'));
      setLoading(false);
      return;
    }
    try {
      const res = await fetch('/api/delivery', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          articles: form.articles.map(a => ({
            ...a,
            quantite: Number(a.quantite),
            quantiteRecue: Number(a.quantiteRecue)
          }))
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

  const bcOptions = orders.filter((order: any) => {
    const livraison = getLivraisonByNumBC(order.numBC);
    return !livraison || livraison.conformite !== 'conforme';
  }).map((order: any) => {
    const livraison = getLivraisonByNumBC(order.numBC);
    return {
      id: order.id,
      fournisseur: order.fournisseur?.name || 'Fournisseur ?',
      numBC: order.numBC,
      service: order.service?.name || 'N/A',
      livraisonConformite: livraison?.conformite || null
    };
  }).filter((option: any) => {
    const q = bcSearch.toLowerCase();
    return (
      option.fournisseur.toLowerCase().includes(q) ||
      (option.numBC || '').toLowerCase().includes(q) ||
      option.service.toLowerCase().includes(q)
    );
  });

  const SelectorIcon = ChevronUpDownIcon;

  return (
    <HeaderLayout>
      <div className="max-w-6xl mx-auto px-2 sm:px-8 py-10">
        <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl p-6 sm:p-12 border border-gray-200 dark:border-gray-800 space-y-10">
          <div className="mb-2 flex items-center gap-3">
            <h1 className="text-3xl font-extrabold text-orange-500 tracking-tight flex items-center gap-2">Nouvelle livraison</h1>
          </div>
          {/* Section Liaison BC */}
          <SectionTitle>Liaison à un bon de commande</SectionTitle>
          <div className="mb-4">
            <SearchableListbox
              options={bcOptions}
              value={selectedOrderId}
              onChange={setSelectedOrderId}
              placeholder="Sélectionner ou rechercher un bon de commande..."
              noneLabel="Aucun (saisie manuelle)"
              renderOption={option => (
                <span>
                  <span className="font-bold text-gray-900 dark:text-white">{option.fournisseur}</span>
                  <span className="ml-2 text-orange-600 font-semibold">BC: {option.numBC}</span>
                  <span className="ml-2 text-gray-500 text-sm">{option.service}</span>
                  {option.livraisonConformite && (
                    <span className={`ml-2 px-2 py-1 rounded-full text-xs font-semibold ${option.livraisonConformite === 'litige' ? 'bg-red-100 text-red-700' : option.livraisonConformite === 'back_order' ? 'bg-yellow-100 text-yellow-700' : option.livraisonConformite === 'non_controle' ? 'bg-gray-100 text-gray-700' : 'bg-blue-100 text-blue-700'}`}>Déjà livré : {option.livraisonConformite}</span>
                  )}
                </span>
              )}
              renderValue={option => (
                option ? (
                  <span>
                    <span className="font-bold text-gray-900 dark:text-white">{option.fournisseur}</span>
                    <span className="ml-2 text-orange-600 font-semibold">BC: {option.numBC}</span>
                    <span className="ml-2 text-gray-500 text-sm">{option.service}</span>
                    {option.livraisonConformite && (
                      <span className={`ml-2 px-2 py-1 rounded-full text-xs font-semibold ${option.livraisonConformite === 'litige' ? 'bg-red-100 text-red-700' : option.livraisonConformite === 'back_order' ? 'bg-yellow-100 text-yellow-700' : option.livraisonConformite === 'non_controle' ? 'bg-gray-100 text-gray-700' : 'bg-blue-100 text-blue-700'}`}>Déjà livré : {option.livraisonConformite}</span>
                    )}
                  </span>
                ) : <span className="text-gray-400">Sélectionner un bon de commande…</span>
              )}
            />
          </div>
          {/* Saisie manuelle du numéro de BC si aucun BC lié */}
          {!selectedOrderId && (
            <InputCard icon={<DocumentTextIcon className="w-5 h-5" />} label="Numéro du bon de commande *">
              <input type="text" name="numBC" value={form.numBC} onChange={handleChange} required className="w-full rounded-lg border-none bg-transparent dark:text-white focus:ring-0 text-base placeholder-gray-400 dark:placeholder-gray-500" placeholder="Saisir le numéro de BC" />
            </InputCard>
          )}
          {/* Section Informations générales */}
          <SectionTitle>Informations générales</SectionTitle>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
            <InputCard icon={<DocumentTextIcon className="w-5 h-5" />} label="Fournisseur *">
              <Listbox value={form.fournisseurId} onChange={v => setForm(f => ({ ...f, fournisseurId: v }))}>
                <div className="relative">
                  <Listbox.Button className="w-full rounded-lg border border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-white focus:ring-2 focus:ring-orange-500 px-4 py-2 text-left">
                    {form.fournisseurId ? fournisseurs.find((f: any) => f.id === form.fournisseurId)?.name : <span className="text-gray-400">Sélectionner…</span>}
                    <ChevronUpDownIcon className="w-5 h-5 absolute right-2 top-1/2 -translate-y-1/2 text-gray-400" />
                  </Listbox.Button>
                  <Listbox.Options className="absolute z-10 mt-1 w-full bg-white dark:bg-gray-900 shadow-lg max-h-60 rounded-lg py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none">
                    {fournisseurs.map((f: any) => (
                      <Listbox.Option key={f.id} value={f.id} className={({ active }) => `cursor-pointer select-none relative py-2 pl-10 pr-4 ${active ? 'bg-orange-100 dark:bg-gray-800' : ''}`}>
                        {({ selected }) => (
                          <>
                            <span className="font-bold text-gray-900 dark:text-white">{f.name}</span>
                            {selected && <CheckIcon className="w-5 h-5 text-orange-500 absolute left-2 top-1/2 -translate-y-1/2" />}
                          </>
                        )}
                      </Listbox.Option>
                    ))}
                  </Listbox.Options>
                </div>
              </Listbox>
            </InputCard>
            <InputCard icon={<DocumentTextIcon className="w-5 h-5" />} label="Service *">
              <Listbox value={form.serviceId} onChange={v => setForm(f => ({ ...f, serviceId: v }))}>
                <div className="relative">
                  <Listbox.Button className="w-full rounded-lg border border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-white focus:ring-2 focus:ring-orange-500 px-4 py-2 text-left">
                    {form.serviceId ? services.find((s: any) => s.id === form.serviceId)?.name : <span className="text-gray-400">Sélectionner…</span>}
                    <ChevronUpDownIcon className="w-5 h-5 absolute right-2 top-1/2 -translate-y-1/2 text-gray-400" />
                  </Listbox.Button>
                  <Listbox.Options className="absolute z-10 mt-1 w-full bg-white dark:bg-gray-900 shadow-lg max-h-60 rounded-lg py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none">
                    {services.map((s: any) => (
                      <Listbox.Option key={s.id} value={s.id} className={({ active }) => `cursor-pointer select-none relative py-2 pl-10 pr-4 ${active ? 'bg-orange-100 dark:bg-gray-800' : ''}`}>
                        {({ selected }) => (
                          <>
                            <span className="font-bold text-gray-900 dark:text-white">{s.name}</span>
                            {selected && <CheckIcon className="w-5 h-5 text-orange-500 absolute left-2 top-1/2 -translate-y-1/2" />}
                          </>
                        )}
                      </Listbox.Option>
                    ))}
                  </Listbox.Options>
                </div>
              </Listbox>
            </InputCard>
            <InputCard icon={<DocumentTextIcon className="w-5 h-5" />} label="Date de livraison *">
              <input type="date" name="dateLivraison" value={form.dateLivraison} onChange={handleChange} required className="w-full rounded-lg border-none bg-transparent dark:text-white focus:ring-0 text-base" />
            </InputCard>
            <InputCard icon={<DocumentTextIcon className="w-5 h-5" />} label="Heure d'arrivée *">
              <input type="time" name="heureArrivee" value={form.heureArrivee} onChange={handleChange} required className="w-full rounded-lg border-none bg-transparent dark:text-white focus:ring-0 text-base" />
            </InputCard>
            <InputCard icon={<DocumentTextIcon className="w-5 h-5" />} label="Numéro BL">
              <input type="text" name="numBL" value={form.numBL} onChange={handleChange} className="w-full rounded-lg border-none bg-transparent dark:text-white focus:ring-0 text-base placeholder-gray-400 dark:placeholder-gray-500" placeholder="Saisir le numéro de BL" />
            </InputCard>
            <InputCard icon={<DocumentTextIcon className="w-5 h-5" />} label="Type *">
              <Listbox value={form.type} onChange={v => setForm(f => ({ ...f, type: v }))}>
                <div className="relative">
                  <Listbox.Button className="w-full rounded-lg border border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-white focus:ring-2 focus:ring-orange-500 px-4 py-2 text-left">
                    {form.type === 'alimentaire' ? 'Alimentaire' : 'Non alimentaire'}
                    <ChevronUpDownIcon className="w-5 h-5 absolute right-2 top-1/2 -translate-y-1/2 text-gray-400" />
                  </Listbox.Button>
                  <Listbox.Options className="absolute z-10 mt-1 w-full bg-white dark:bg-gray-900 shadow-lg max-h-60 rounded-lg py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none">
                    <Listbox.Option value="alimentaire" className={({ active }) => `cursor-pointer select-none relative py-2 pl-10 pr-4 ${active ? 'bg-orange-100 dark:bg-gray-800' : ''}`}>Alimentaire</Listbox.Option>
                    <Listbox.Option value="non_alimentaire" className={({ active }) => `cursor-pointer select-none relative py-2 pl-10 pr-4 ${active ? 'bg-orange-100 dark:bg-gray-800' : ''}`}>Non alimentaire</Listbox.Option>
                  </Listbox.Options>
                </div>
              </Listbox>
            </InputCard>
            {form.type === 'alimentaire' && (
              <>
                <InputCard icon={<ArrowTrendingDownIcon className="w-5 h-5" />} label="Température frais (°C)">
                  <div className="flex items-center gap-2">
                    <input type="number" name="tempFrais" value={form.tempFrais} onChange={handleChange} step="0.1" className="w-full rounded-lg border-none bg-transparent dark:text-white focus:ring-0 text-base placeholder-gray-400 dark:placeholder-gray-500" placeholder="Ex : 4.5" />
                    <span className="text-xs text-orange-500 font-bold">°C</span>
                  </div>
                </InputCard>
                <InputCard icon={<ArrowTrendingUpIcon className="w-5 h-5" />} label="Température congelé (°C)">
                  <div className="flex items-center gap-2">
                    <input type="number" name="tempCongele" value={form.tempCongele} onChange={handleChange} step="0.1" className="w-full rounded-lg border-none bg-transparent dark:text-white focus:ring-0 text-base placeholder-gray-400 dark:placeholder-gray-500" placeholder="Ex : -18" />
                    <span className="text-xs text-orange-500 font-bold">°C</span>
                  </div>
                </InputCard>
              </>
            )}
            <InputCard icon={<DocumentTextIcon className="w-5 h-5" />} label="Conformité *">
              <Listbox value={form.conformite} onChange={v => setForm(f => ({ ...f, conformite: v }))}>
                <div className="relative">
                  <Listbox.Button className="w-full rounded-lg border border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-white focus:ring-2 focus:ring-orange-500 px-4 py-2 text-left">
                    {form.conformite.charAt(0).toUpperCase() + form.conformite.slice(1)}
                    <ChevronUpDownIcon className="w-5 h-5 absolute right-2 top-1/2 -translate-y-1/2 text-gray-400" />
                  </Listbox.Button>
                  <Listbox.Options className="absolute z-10 mt-1 w-full bg-white dark:bg-gray-900 shadow-lg max-h-60 rounded-lg py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none">
                    <Listbox.Option value="conforme" className={({ active }) => `cursor-pointer select-none relative py-2 pl-10 pr-4 ${active ? 'bg-green-100 dark:bg-green-900' : ''}`}>Conforme</Listbox.Option>
                    <Listbox.Option value="litige" className={({ active }) => `cursor-pointer select-none relative py-2 pl-10 pr-4 ${active ? 'bg-red-100 dark:bg-red-900' : ''}`}>Litige</Listbox.Option>
                    <Listbox.Option value="back_order" className={({ active }) => `cursor-pointer select-none relative py-2 pl-10 pr-4 ${active ? 'bg-yellow-100 dark:bg-yellow-900' : ''}`}>Back Order</Listbox.Option>
                    <Listbox.Option value="non_controle" className={({ active }) => `cursor-pointer select-none relative py-2 pl-10 pr-4 ${active ? 'bg-gray-100 dark:bg-gray-900' : ''}`}>Non contrôlé</Listbox.Option>
                    <Listbox.Option value="autre" className={({ active }) => `cursor-pointer select-none relative py-2 pl-10 pr-4 ${active ? 'bg-blue-100 dark:bg-blue-900' : ''}`}>Autre</Listbox.Option>
                  </Listbox.Options>
                </div>
              </Listbox>
            </InputCard>
          </div>
          {/* Section Remarques */}
          <SectionTitle>Remarques</SectionTitle>
          {/* Articles dynamiques avec verrouillage */}
          <div className="bg-orange-50 dark:bg-gray-900/40 rounded-3xl p-6 border-2 border-orange-200 dark:border-orange-700 mt-2 shadow-xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-orange-500 flex items-center gap-2"><CubeIcon className="w-6 h-6" /> Articles livrés</h3>
              <button type="button" onClick={addArticle} className="bg-orange-500 text-white px-4 py-2 rounded-full hover:bg-orange-600 text-sm shadow flex items-center gap-2 font-semibold transition">
                <PlusIcon className="w-5 h-5" /> Ajouter un article
              </button>
            </div>
            {/* En-tête de colonnes visible partout */}
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2 px-2 pb-2 text-xs font-semibold text-gray-700 dark:text-gray-200 uppercase tracking-wider bg-orange-100 dark:bg-gray-800 rounded-t-lg">
              <div>Nom</div>
              <div>Référence</div>
              <div className="hidden sm:block">Qté commandée</div>
              <div className="hidden sm:block">Déjà livré</div>
              <div className="hidden sm:block">Qté restante</div>
              <div className="hidden sm:block">Qté livrée</div>
              <div className="hidden sm:block">Conformité</div>
              <div className="hidden md:block"></div>
            </div>
            <div>
              {form.articles.length === 0 && (
                <div className="text-red-600 font-bold">Aucun article à afficher (debug)</div>
              )}
              {form.articles.map((a, i) => {
                let dejaBon = 0, dejaLitige = 0, dejaTotal = 0;
                if (Array.isArray(rapportLivraisons?.rapport) && a.reference) {
                  const rapport = rapportLivraisons.rapport.find((r: any) => r.reference === a.reference);
                  dejaBon = rapport?.bon || 0;
                  dejaLitige = rapport?.litige || 0;
                  dejaTotal = dejaBon + dejaLitige;
                }
                
                // Calculer la quantité restante en tenant compte des livraisons en litige
                const quantiteRestante = a.quantite ? String(Math.max(Number(a.quantite) - dejaTotal, 0)) : '';
                
                // Logique de verrouillage : 
                // 1. Si tout est déjà livré (bon + litige = quantité commandée)
                // 2. Si l'article est déjà en litige et qu'on essaie de le livrer comme bon
                const isVerrouille = 
                  Number(a.quantite) <= dejaTotal ||
                  (dejaLitige > 0 && Number(a.quantiteRecue) > 0 && a.conformite === 'conforme');
                
                // Vérifier les quantités reçues
                let alertMsg = '';
                if (!isVerrouille) {
                  // Vérifier que la quantité reçue ne dépasse pas la quantité restante
                  if (quantiteRestante !== '' && Number(a.quantiteRecue) > Number(quantiteRestante)) {
                    alertMsg = `Vous ne pouvez pas livrer plus que le restant (${quantiteRestante}) pour cet article.`;
                  }
                  // Vérifier que la quantité reçue est positive
                  else if (Number(a.quantiteRecue) < 0) {
                    alertMsg = "La quantité reçue doit être positive.";
                  }
                  // Vérifier que la quantité reçue n'est pas supérieure à la quantité commandée
                  else if (Number(a.quantiteRecue) > Number(a.quantite)) {
                    alertMsg = `La quantité reçue ne peut pas être supérieure à la quantité commandée (${a.quantite}).`;
                  }
                }
                return (
                  <div key={i} className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2 bg-white dark:bg-gray-900 p-3 rounded-lg border border-gray-100 dark:border-gray-800 items-center relative">
                    <input type="text" name="nom" value={a.nom} onChange={e => handleArticleChange(i, e)} placeholder="Nom *" required className="rounded-lg border-gray-300 dark:bg-gray-800 dark:text-white" />
                    <input type="text" name="reference" value={a.reference} onChange={e => handleArticleChange(i, e)} placeholder="Référence" className="rounded-lg border-gray-300 dark:bg-gray-800 dark:text-white" />
                    <input type="number" name="quantite" value={a.quantite} onChange={e => handleArticleChange(i, e)} placeholder="Qté commandée *" required min="0" step="0.01" className="rounded-lg border-gray-300 dark:bg-gray-800 dark:text-white" />
                    <div className="text-xs text-gray-500">{Number(a.dejaBon) + Number(a.dejaLitige) || 0}</div>
                    <div className="text-xs text-gray-500">{quantiteRestante || 0}</div>
                    <div className="flex flex-col gap-1">
                      <div className="relative">
                        <input
                          type="number"
                          name="quantiteRecue"
                          value={a.quantiteRecue}
                          onChange={e => handleArticleChange(i, e)}
                          placeholder="Qté livrée *"
                          required
                          min="0"
                          step="0.01"
                          className={`rounded-lg border-gray-300 dark:bg-gray-800 dark:text-white pr-8 ${alertMsg ? 'border-red-500' : a.quantiteRestante === '0' ? 'bg-gray-100 dark:bg-gray-800 text-gray-400' : ''}`}
                          disabled={a.quantiteRestante === '0'}
                          max={a.quantiteRestante || undefined}
                        />
                        {alertMsg && (
                          <div className="absolute top-full left-0 mt-1 bg-red-500 text-white px-2 py-1 rounded text-xs">
                            {alertMsg}
                          </div>
                        )}
                      </div>
                      {a.quantiteRestante === '0' && (
                        <span className="text-green-500 text-xs" title="Quantité déjà livrée"><CheckIcon className="w-4 h-4 inline" /> Tout livré</span>
                      )}
                    </div>
                    <div>
                      <Listbox
                        value={a.conformite}
                        onChange={v => handleArticleChange(i, { target: { name: 'conformite', value: v } } as any)}
                      >
                        <div className="relative mt-1">
                          <Listbox.Button className="w-full rounded-lg border border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-white px-2 py-1 text-left flex items-center">
                            <span>
                              {a.conformite
                                ? a.conformite.charAt(0).toUpperCase() + a.conformite.slice(1)
                                : 'Sélectionner'}
                            </span>
                            <ChevronUpDownIcon className="w-4 h-4 ml-2 text-orange-400" />
                          </Listbox.Button>
                          <Listbox.Options className="absolute z-10 mt-1 w-full bg-white dark:bg-gray-900 shadow-lg max-h-40 rounded-lg py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none">
                            <Listbox.Option value="conforme" className={({ active }) => `cursor-pointer select-none relative py-2 pl-8 pr-4 ${active ? 'bg-green-100 dark:bg-green-900' : ''}`}>Conforme</Listbox.Option>
                            <Listbox.Option value="litige" className={({ active }) => `cursor-pointer select-none relative py-2 pl-8 pr-4 ${active ? 'bg-red-100 dark:bg-red-900' : ''}`}>Litige</Listbox.Option>
                            <Listbox.Option value="back_order" className={({ active }) => `cursor-pointer select-none relative py-2 pl-8 pr-4 ${active ? 'bg-yellow-100 dark:bg-yellow-900' : ''}`}>Back Order</Listbox.Option>
                            <Listbox.Option value="non_controle" className={({ active }) => `cursor-pointer select-none relative py-2 pl-8 pr-4 ${active ? 'bg-gray-100 dark:bg-gray-900' : ''}`}>Non contrôlé</Listbox.Option>
                            <Listbox.Option value="autre" className={({ active }) => `cursor-pointer select-none relative py-2 pl-8 pr-4 ${active ? 'bg-blue-100 dark:bg-blue-900' : ''}`}>Autre</Listbox.Option>
                          </Listbox.Options>
                        </div>
                      </Listbox>
                    </div>
                    <button type="button" onClick={() => removeArticle(i)} className="text-red-500 hover:text-red-700">Supprimer</button>
                  </div>
                );
              })}
            </div>
          </div>
          {/* Feedbacks */}
          {error && <div className="p-3 bg-red-100 text-red-700 rounded-lg text-center text-sm font-semibold flex items-center justify-center gap-2"><ExclamationTriangleIcon className="w-5 h-5" /> {error}</div>}
          {success && <div className="p-3 bg-green-100 text-green-700 rounded-lg text-center text-sm font-semibold">Livraison ajoutée !</div>}
          {/* Boutons */}
          <div className="flex justify-end gap-3 mt-4">
            <button type="button" onClick={() => setCancelDialogOpen(true)} className="px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800">Annuler</button>
            <button type="submit" disabled={loading} className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-60 font-semibold shadow">{loading ? 'Enregistrement…' : 'Enregistrer'}</button>
          </div>
          {/* Dialog d'annulation */}
          <Transition.Root show={cancelDialogOpen} as={React.Fragment}>
            <Dialog as="div" className="relative z-50" onClose={setCancelDialogOpen}>
              <Transition.Child
                as={React.Fragment}
                enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100"
                leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0"
              >
                <div className="fixed inset-0 bg-black/40 transition-opacity" />
              </Transition.Child>
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                <Transition.Child
                  as={React.Fragment}
                  enter="ease-out duration-300" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100"
                  leave="ease-in duration-200" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95"
                >
                  <Dialog.Panel className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl p-8 max-w-sm w-full border border-gray-200 dark:border-gray-800">
                    <Dialog.Title className="text-lg font-bold text-orange-500 mb-4 flex items-center gap-2"><ExclamationTriangleIcon className="w-6 h-6" /> Annuler la création</Dialog.Title>
                    <Dialog.Description className="mb-6 text-gray-700 dark:text-gray-200">Voulez-vous vraiment annuler la création de cette livraison ? Les informations saisies seront perdues.</Dialog.Description>
                    <div className="flex justify-end gap-3">
                      <button onClick={() => setCancelDialogOpen(false)} className="px-4 py-2 border border-gray-300 dark:border-gray-700 rounded text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 font-semibold">Revenir</button>
                      <button onClick={() => router.push('/delivery/controle')} className="px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600 font-semibold shadow">Oui, annuler</button>
                    </div>
                  </Dialog.Panel>
                </Transition.Child>
              </div>
            </Dialog>
          </Transition.Root>
        </form>
      </div>
    </HeaderLayout>
  );
} 