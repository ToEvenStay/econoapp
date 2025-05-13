import React, { useState, useMemo, useEffect } from 'react';
import useSWR from 'swr';
import HeaderLayout from '../../components/HeaderLayout';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSearch, faBoxOpen, faClipboardList, faCheckCircle, faArchive, faTimes, faEdit, faTruck, faPlus } from '@fortawesome/free-solid-svg-icons';
import { Dialog, Transition } from '@headlessui/react';
import { useRouter } from "next/router";
import { useAuth } from '../../lib/useAuth';

const fetcher = (url: string) => fetch(url).then(r => r.json());

// Copier la fonction conformityBadge depuis controle.tsx
const conformityBadge = (conformite: string) => {
  switch (conformite) {
    case 'conforme': return 'bg-green-100 text-green-800';
    case 'litige': return 'bg-red-100 text-red-800';
    case 'back_order': return 'bg-yellow-100 text-yellow-800';
    case 'non_controle': return 'bg-gray-100 text-gray-800';
    default: return 'bg-blue-100 text-blue-800';
  }
};

// Ajout d'un menu d'onglets pour les catégories
const CATEGORIES = [
  { key: 'a_recevoir', label: 'À recevoir' },
  { key: 'litige', label: 'Litige' },
  { key: 'back_order', label: 'Back order' },
  { key: 'non_controle', label: 'Non contrôlé' },
  { key: 'anciens', label: 'Anciens bons' },
];

export default function IncomingOrdersPage() {
  const router = useRouter();
  const { isAuthenticated, isReady } = useAuth();
  const { data: orders = [], isLoading } = useSWR('/api/orders', fetcher);
  const [search, setSearch] = useState('');

  // Filtres de date pour anciens bons (par défaut sur 1 mois)
  const today = new Date();
  const oneMonthAgo = new Date();
  oneMonthAgo.setMonth(today.getMonth() - 1);
  const [dateDebutAncien, setDateDebutAncien] = useState(oneMonthAgo.toISOString().slice(0, 10));
  const [dateFinAncien, setDateFinAncien] = useState(today.toISOString().slice(0, 10));

  // État pour la modale de détail BC
  const [orderDetail, setOrderDetail] = useState<any | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  // Menu d'onglets
  const [tab, setTab] = useState('a_recevoir');

  useEffect(() => {
    if (isReady && !isAuthenticated) {
      router.push('/login');
    }
  }, [isReady, isAuthenticated, router]);

  const filteredOrders = useMemo(() => {
    const q = search.toLowerCase();
    if (!Array.isArray(orders)) return [];
    return orders.filter((order: any) => {
      // Recherche sur fournisseur, service, numBC, produits (nom, ref, qté)
      const items = Array.isArray(order.items)
        ? order.items.join(' ').toLowerCase()
        : String(order.items).toLowerCase();
      return (
        (order.fournisseur?.name?.toLowerCase() || '').includes(q) ||
        (order.service?.name?.toLowerCase() || '').includes(q) ||
        (order.numBC || '').toLowerCase().includes(q) ||
        items.includes(q)
      );
    }).sort((a: any, b: any) => {
      // Tri alphabétique fournisseur
      return (a.fournisseur?.name || '').localeCompare(b.fournisseur?.name || '');
    });
  }, [orders, search]);

  const numBCs = filteredOrders.map((order: any) => order.numBC).filter(Boolean);
  const { data: linkedLivraisons = [] } = useSWR(
    numBCs.length ? `/api/delivery?numBCs=${encodeURIComponent(JSON.stringify(numBCs))}` : null,
    fetcher
  );

  if (!isReady) return null;

  // Filtrage par catégorie
  function isAncien(order: any, livraison: any) {
    if (!livraison) return false;
    // Exclure si au moins un article est en litige, back order ou non contrôlé
    if (livraison.articles.some((a: any) => ['litige', 'back_order', 'non_controle'].includes(a.conformite))) return false;
    // Tous les articles doivent être conformes ET quantités reçues = attendues (si quantiteRecue absent, on prend quantite)
    return livraison.articles && livraison.articles.length > 0 &&
      livraison.articles.every((a: any) => a.conformite === 'conforme' && Number(a.quantite ?? -1) === Number((a.quantiteRecue ?? a.quantite) ?? -2));
  }
  function isLitigeStrict(livraison: any) {
    return livraison && livraison.articles && livraison.articles.some((a: any) => a.conformite === 'litige');
  }
  function isBackOrderStrict(livraison: any) {
    return livraison && livraison.articles && livraison.articles.some((a: any) => a.conformite === 'back_order');
  }
  function isNonControleStrict(livraison: any) {
    return livraison && livraison.articles && livraison.articles.some((a: any) => a.conformite === 'non_controle');
  }

  // Filtrage anciens bons par période
  const commandesAnciennes = filteredOrders.filter((order: any) => {
    const livraison = linkedLivraisons.find((l: any) => l.numBC === order.numBC);
    if (!livraison) return false;
    const dateLivraison = livraison.dateLivraison ? new Date(livraison.dateLivraison) : null;
    if (!dateLivraison) return false;
    if (dateLivraison < new Date(dateDebutAncien) || dateLivraison > new Date(dateFinAncien)) return false;
    // Uniquement les bons 100% conformes (pas litige, pas back order, pas non contrôlé)
    return isAncien(order, livraison);
  });
  const commandesLitige = filteredOrders.filter((order: any) => {
    const livraison = linkedLivraisons.find((l: any) => l.numBC === order.numBC);
    return isLitigeStrict(livraison);
  });
  const commandesBackOrder = filteredOrders.filter((order: any) => {
    const livraison = linkedLivraisons.find((l: any) => l.numBC === order.numBC);
    return isBackOrderStrict(livraison);
  });
  const commandesNonControle = filteredOrders.filter((order: any) => {
    const livraison = linkedLivraisons.find((l: any) => l.numBC === order.numBC);
    return isNonControleStrict(livraison);
  });
  const commandesARecevoir = filteredOrders.filter((order: any) => {
    const livraison = linkedLivraisons.find((l: any) => l.numBC === order.numBC);
    return !livraison || livraison.conformite !== 'conforme';
  });

  // Fonction pour ouvrir la modale
  function openOrderDetail(order: any) {
    setOrderDetail(order);
    setModalOpen(true);
  }
  function closeOrderDetail() {
    setModalOpen(false);
    setOrderDetail(null);
  }

  return (
    <HeaderLayout>
      {/* Espace en haut pour arrondir la box */}
      <div className="py-4" />
      {/* Header sticky compact */}
      <div className="sticky top-0 z-20 bg-white/80 dark:bg-gray-900/80 shadow flex items-center justify-between px-6 py-4 backdrop-blur rounded-2xl max-w-5xl mx-auto w-full">
        <h1 className="text-2xl font-bold text-orange-500 flex items-center gap-2">
          <FontAwesomeIcon icon={faTruck} /> Commandes à recevoir
        </h1>
        <div className="flex items-center gap-4">
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Rechercher fournisseur, BC, service, produit..."
            className="rounded-xl border border-gray-200 dark:border-gray-700 px-4 py-2 shadow bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:border-orange-500 focus:ring-2 focus:ring-orange-500 focus:ring-opacity-50 transition"
          />
          <button
            type="button"
            onClick={() => window.location.href = '/orders/add'}
            className="bg-orange-500 hover:bg-orange-600 text-white font-semibold px-4 py-2 rounded-xl shadow flex items-center gap-2 text-base transition"
          >
            <FontAwesomeIcon icon={faPlus} /> Ajouter
          </button>
        </div>
      </div>
      {/* Menu d'onglets */}
      <div className="w-full flex justify-center mt-4 mb-8">
        <div className="flex gap-2 bg-white dark:bg-gray-900 rounded-xl shadow border border-gray-200 dark:border-gray-800 px-2 py-1">
          {CATEGORIES.map(cat => (
            <button
              key={cat.key}
              onClick={() => setTab(cat.key)}
              className={`px-4 py-2 rounded-lg font-semibold text-sm transition ${tab === cat.key ? 'bg-orange-500 text-white shadow' : 'text-gray-700 dark:text-gray-200 hover:bg-orange-100 dark:hover:bg-gray-800'}`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>
      {/* Grille de cards commandes à recevoir */}
      <div className="container max-w-5xl mx-auto px-4 py-8">
        {/* Afficher un loader si les commandes sont en cours de chargement */}
        {isLoading ? (
          <div className="col-span-2 text-center py-12 text-gray-500">Chargement…</div>
        ) : tab === 'a_recevoir' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {commandesARecevoir.length === 0 ? (
              <div className="col-span-2 text-center py-12 text-gray-400 italic">Aucune commande à recevoir</div>
            ) : commandesARecevoir.map((order: any) => {
              const linkedLivraison = linkedLivraisons.find((l: any) => l.numBC === order.numBC);
              // Couleur de statut
              let borderColor = 'border-orange-300';
              if (linkedLivraison?.conformite === 'litige') borderColor = 'border-red-400';
              if (linkedLivraison?.conformite === 'back_order') borderColor = 'border-yellow-400';
              if (linkedLivraison?.conformite === 'non_controle') borderColor = 'border-gray-400';
              return (
                <div key={order.id} className={`group relative rounded-2xl shadow-xl bg-white/70 dark:bg-gray-900/70 border-l-8 ${borderColor} p-6 flex flex-col gap-4 hover:scale-[1.02] hover:shadow-2xl transition-all duration-200 cursor-pointer backdrop-blur`} onClick={e => {
                  if ((e.target as HTMLElement).closest('button')) return;
                  openOrderDetail(order);
                }}>
                  <div className="flex flex-col gap-2">
                    <div className="flex flex-wrap items-center gap-3 mb-1">
                      <span className="inline-flex items-center gap-2 text-base font-semibold text-orange-600"><FontAwesomeIcon icon={faBoxOpen} /> {order.fournisseur?.name || 'Fournisseur inconnu'}</span>
                      <span className="inline-flex items-center gap-2 text-xs text-gray-500"><FontAwesomeIcon icon={faClipboardList} /> BC : {order.numBC}</span>
                      <span className="inline-flex items-center gap-2 text-xs text-gray-500">Service : {order.service?.name || 'N/A'}</span>
                      {order.destination && (
                        <span className="inline-flex items-center gap-2 text-xs text-blue-500 font-semibold bg-blue-50 dark:bg-blue-900 px-2 py-1 rounded-full">Destination : {order.destination}</span>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="inline-flex items-center gap-2 text-xs text-gray-400">Ajouté le {order.createdAt ? new Date(order.createdAt).toLocaleDateString('fr-FR') : '-'}</span>
                      {linkedLivraison && (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-green-100 text-green-700 text-xs font-semibold"><FontAwesomeIcon icon={faCheckCircle} className="mr-1" /> Lié à une livraison</span>
                      )}
                      {linkedLivraison && (
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${conformityBadge(linkedLivraison.conformite)}`} title={linkedLivraison.conformite}><FontAwesomeIcon icon={faCheckCircle} className="mr-1" />{linkedLivraison.conformite}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {Array.isArray(order.items) ? order.items.map((item: any, idx: number) => (
                      <span key={idx} className="inline-block bg-orange-50 dark:bg-gray-800 text-orange-700 dark:text-orange-300 px-3 py-1 rounded-full text-xs font-medium border border-orange-100 dark:border-orange-900">{item}</span>
                    )) : <span className="inline-block bg-orange-50 dark:bg-gray-800 text-orange-700 dark:text-orange-300 px-3 py-1 rounded-full text-xs font-medium border border-orange-100 dark:border-orange-900">{order.items}</span>}
                  </div>
                  <div className="flex gap-2 mt-4 justify-end">
                    <button
                      type="button"
                      onClick={e => { e.stopPropagation(); openOrderDetail(order); }}
                      className="bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 font-semibold px-3 py-1 rounded-lg shadow text-xs border border-gray-200 dark:border-gray-700 transition flex items-center gap-1"
                    >
                      <FontAwesomeIcon icon={faClipboardList} /> Voir
                    </button>
                    <button
                      type="button"
                      onClick={e => { e.stopPropagation(); window.open(`/orders/edit/${order.id}`, '_blank'); }}
                      className="bg-orange-500 hover:bg-orange-600 text-white font-semibold px-4 py-2 rounded-lg shadow text-xs flex items-center gap-1 transition"
                    >
                      <FontAwesomeIcon icon={faEdit} /> Modifier
                    </button>
                    {linkedLivraison && (
                      <button
                        type="button"
                        onClick={e => { e.stopPropagation(); window.location.href = `/delivery/${linkedLivraison.id}`; }}
                        className="bg-green-100 hover:bg-green-200 text-green-800 font-semibold px-4 py-2 rounded-lg shadow text-xs flex items-center gap-1 transition"
                      >
                        <FontAwesomeIcon icon={faTruck} /> Livraison
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : null}
        {tab === 'anciens' && (
          <div className="mt-8">
            <div className="flex flex-wrap gap-4 mb-6 items-end">
              <h2 className="text-lg font-bold flex items-center gap-2 text-gray-700 dark:text-gray-200">
                <FontAwesomeIcon icon={faArchive} /> Anciens bons de commande
              </h2>
              <div className="flex gap-2 items-center ml-4">
                <label className="text-sm font-semibold">Du</label>
                <input type="date" value={dateDebutAncien} onChange={e => setDateDebutAncien(e.target.value)} className="border border-gray-300 dark:border-gray-700 rounded px-2 py-1 text-sm bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200" />
                <label className="text-sm font-semibold">au</label>
                <input type="date" value={dateFinAncien} onChange={e => setDateFinAncien(e.target.value)} className="border border-gray-300 dark:border-gray-700 rounded px-2 py-1 text-sm bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200" />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {commandesAnciennes.length === 0 ? (
                <div className="col-span-2 text-center py-12 text-gray-400 italic">Aucun ancien bon de commande</div>
              ) : commandesAnciennes.map((order: any) => {
                const linkedLivraison = linkedLivraisons.find((l: any) => l.numBC === order.numBC);
                // Couleur de statut
                let borderColor = 'border-orange-300';
                let badge = '';
                if (linkedLivraison?.conformite === 'conforme') { borderColor = 'border-green-400'; badge = 'Conforme'; }
                if (linkedLivraison?.conformite === 'litige') { borderColor = 'border-red-400'; badge = 'Litige'; }
                if (linkedLivraison?.conformite === 'back_order') { borderColor = 'border-yellow-400'; badge = 'Back order'; }
                if (linkedLivraison?.conformite === 'non_controle') { borderColor = 'border-gray-400'; badge = 'Non contrôlé'; }
                return (
                  <div key={order.id} className={`group relative rounded-2xl shadow-xl bg-white/70 dark:bg-gray-900/70 border-l-8 ${borderColor} p-6 flex flex-col gap-4 hover:scale-[1.02] hover:shadow-2xl transition-all duration-200 cursor-pointer backdrop-blur`} onClick={e => {
                    if ((e.target as HTMLElement).closest('button')) return;
                    openOrderDetail(order);
                  }}>
                    <div className="flex flex-col gap-2">
                      <div className="flex flex-wrap items-center gap-3 mb-1">
                        <span className="inline-flex items-center gap-2 text-base font-semibold text-orange-600"><FontAwesomeIcon icon={faBoxOpen} /> {order.fournisseur?.name || 'Fournisseur inconnu'}</span>
                        <span className="inline-flex items-center gap-2 text-xs text-gray-500"><FontAwesomeIcon icon={faClipboardList} /> BC : {order.numBC}</span>
                        <span className="inline-flex items-center gap-2 text-xs text-gray-500">Service : {order.service?.name || 'N/A'}</span>
                        {order.destination && (
                          <span className="inline-flex items-center gap-2 text-xs text-blue-500 font-semibold bg-blue-50 dark:bg-blue-900 px-2 py-1 rounded-full">Destination : {order.destination}</span>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="inline-flex items-center gap-2 text-xs text-gray-400">Ajouté le {order.createdAt ? new Date(order.createdAt).toLocaleDateString('fr-FR') : '-'}</span>
                        {linkedLivraison && (
                          <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${conformityBadge(linkedLivraison.conformite)}`} title={linkedLivraison.conformite}><FontAwesomeIcon icon={faCheckCircle} className="mr-1" />{badge}</span>
                        )}
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-gray-200 text-gray-600 text-xs font-semibold"><FontAwesomeIcon icon={faArchive} className="mr-1" /> Archivé</span>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {Array.isArray(order.items) ? order.items.map((item: any, idx: number) => (
                        <span key={idx} className="inline-block bg-orange-50 dark:bg-gray-800 text-orange-700 dark:text-orange-300 px-3 py-1 rounded-full text-xs font-medium border border-orange-100 dark:border-orange-900">{item}</span>
                      )) : <span className="inline-block bg-orange-50 dark:bg-gray-800 text-orange-700 dark:text-orange-300 px-3 py-1 rounded-full text-xs font-medium border border-orange-100 dark:border-orange-900">{order.items}</span>}
                    </div>
                    <div className="flex gap-2 mt-4 justify-end">
                      <button
                        type="button"
                        onClick={e => { e.stopPropagation(); openOrderDetail(order); }}
                        className="bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 font-semibold px-3 py-1 rounded-lg shadow text-xs border border-gray-200 dark:border-gray-700 transition flex items-center gap-1"
                      >
                        <FontAwesomeIcon icon={faClipboardList} /> Voir
                      </button>
                      <button
                        type="button"
                        onClick={e => { e.stopPropagation(); window.open(`/orders/edit/${order.id}`, '_blank'); }}
                        className="bg-orange-500 hover:bg-orange-600 text-white font-semibold px-4 py-2 rounded-lg shadow text-xs flex items-center gap-1 transition"
                      >
                        <FontAwesomeIcon icon={faEdit} /> Modifier
                      </button>
                      {linkedLivraison && (
                        <button
                          type="button"
                          onClick={e => { e.stopPropagation(); window.location.href = `/delivery/${linkedLivraison.id}`; }}
                          className="bg-green-100 hover:bg-green-200 text-green-800 font-semibold px-4 py-2 rounded-lg shadow text-xs flex items-center gap-1 transition"
                        >
                          <FontAwesomeIcon icon={faTruck} /> Livraison
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
        {tab === 'litige' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {commandesLitige.length === 0 ? (
              <div className="col-span-2 text-center py-12 text-gray-400 italic">Aucune commande en litige</div>
            ) : commandesLitige.map((order: any) => {
              const linkedLivraison = linkedLivraisons.find((l: any) => l.numBC === order.numBC);
              let borderColor = 'border-red-400';
              let badge = 'Litige';
              if (linkedLivraison?.conformite === 'back_order') { borderColor = 'border-yellow-400'; badge = 'Back order'; }
              if (linkedLivraison?.conformite === 'non_controle') { borderColor = 'border-gray-400'; badge = 'Non contrôlé'; }
              return (
                <div key={order.id} className={`group relative rounded-2xl shadow-xl bg-white/70 dark:bg-gray-900/70 border-l-8 ${borderColor} p-6 flex flex-col gap-4 hover:scale-[1.02] hover:shadow-2xl transition-all duration-200 cursor-pointer backdrop-blur`} onClick={e => {
                  if ((e.target as HTMLElement).closest('button')) return;
                  openOrderDetail(order);
                }}>
                  <div className="flex flex-col gap-2">
                    <div className="flex flex-wrap items-center gap-3 mb-1">
                      <span className="inline-flex items-center gap-2 text-base font-semibold text-orange-600"><FontAwesomeIcon icon={faBoxOpen} /> {order.fournisseur?.name || 'Fournisseur inconnu'}</span>
                      <span className="inline-flex items-center gap-2 text-xs text-gray-500"><FontAwesomeIcon icon={faClipboardList} /> BC : {order.numBC}</span>
                      <span className="inline-flex items-center gap-2 text-xs text-gray-500">Service : {order.service?.name || 'N/A'}</span>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="inline-flex items-center gap-2 text-xs text-gray-400">Ajouté le {order.createdAt ? new Date(order.createdAt).toLocaleDateString('fr-FR') : '-'}</span>
                      {linkedLivraison && (
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${conformityBadge(linkedLivraison.conformite)}`} title={linkedLivraison.conformite}><FontAwesomeIcon icon={faCheckCircle} className="mr-1" />{badge}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {Array.isArray(order.items) ? order.items.map((item: any, idx: number) => (
                      <span key={idx} className="inline-block bg-orange-50 dark:bg-gray-800 text-orange-700 dark:text-orange-300 px-3 py-1 rounded-full text-xs font-medium border border-orange-100 dark:border-orange-900">{item}</span>
                    )) : <span className="inline-block bg-orange-50 dark:bg-gray-800 text-orange-700 dark:text-orange-300 px-3 py-1 rounded-full text-xs font-medium border border-orange-100 dark:border-orange-900">{order.items}</span>}
                  </div>
                  <div className="flex gap-2 mt-4 justify-end">
                    <button
                      type="button"
                      onClick={e => { e.stopPropagation(); openOrderDetail(order); }}
                      className="bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 font-semibold px-3 py-1 rounded-lg shadow text-xs border border-gray-200 dark:border-gray-700 transition flex items-center gap-1"
                    >
                      <FontAwesomeIcon icon={faClipboardList} /> Voir
                    </button>
                    <button
                      type="button"
                      onClick={e => { e.stopPropagation(); window.open(`/orders/edit/${order.id}`, '_blank'); }}
                      className="bg-orange-500 hover:bg-orange-600 text-white font-semibold px-4 py-2 rounded-lg shadow text-xs flex items-center gap-1 transition"
                    >
                      <FontAwesomeIcon icon={faEdit} /> Modifier
                    </button>
                    {linkedLivraison && (
                      <button
                        type="button"
                        onClick={e => { e.stopPropagation(); window.location.href = `/delivery/${linkedLivraison.id}`; }}
                        className="bg-green-100 hover:bg-green-200 text-green-800 font-semibold px-4 py-2 rounded-lg shadow text-xs flex items-center gap-1 transition"
                      >
                        <FontAwesomeIcon icon={faTruck} /> Livraison
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
        {tab === 'back_order' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {commandesBackOrder.length === 0 ? (
              <div className="col-span-2 text-center py-12 text-gray-400 italic">Aucune commande en back order</div>
            ) : commandesBackOrder.map((order: any) => {
              const linkedLivraison = linkedLivraisons.find((l: any) => l.numBC === order.numBC);
              let borderColor = 'border-yellow-400';
              let badge = 'Back order';
              if (linkedLivraison?.conformite === 'litige') { borderColor = 'border-red-400'; badge = 'Litige'; }
              if (linkedLivraison?.conformite === 'non_controle') { borderColor = 'border-gray-400'; badge = 'Non contrôlé'; }
              return (
                <div key={order.id} className={`group relative rounded-2xl shadow-xl bg-white/70 dark:bg-gray-900/70 border-l-8 ${borderColor} p-6 flex flex-col gap-4 hover:scale-[1.02] hover:shadow-2xl transition-all duration-200 cursor-pointer backdrop-blur`} onClick={e => {
                  if ((e.target as HTMLElement).closest('button')) return;
                  openOrderDetail(order);
                }}>
                  <div className="flex flex-col gap-2">
                    <div className="flex flex-wrap items-center gap-3 mb-1">
                      <span className="inline-flex items-center gap-2 text-base font-semibold text-orange-600"><FontAwesomeIcon icon={faBoxOpen} /> {order.fournisseur?.name || 'Fournisseur inconnu'}</span>
                      <span className="inline-flex items-center gap-2 text-xs text-gray-500"><FontAwesomeIcon icon={faClipboardList} /> BC : {order.numBC}</span>
                      <span className="inline-flex items-center gap-2 text-xs text-gray-500">Service : {order.service?.name || 'N/A'}</span>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="inline-flex items-center gap-2 text-xs text-gray-400">Ajouté le {order.createdAt ? new Date(order.createdAt).toLocaleDateString('fr-FR') : '-'}</span>
                      {linkedLivraison && (
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${conformityBadge(linkedLivraison.conformite)}`} title={linkedLivraison.conformite}><FontAwesomeIcon icon={faCheckCircle} className="mr-1" />{badge}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {Array.isArray(order.items) ? order.items.map((item: any, idx: number) => (
                      <span key={idx} className="inline-block bg-orange-50 dark:bg-gray-800 text-orange-700 dark:text-orange-300 px-3 py-1 rounded-full text-xs font-medium border border-orange-100 dark:border-orange-900">{item}</span>
                    )) : <span className="inline-block bg-orange-50 dark:bg-gray-800 text-orange-700 dark:text-orange-300 px-3 py-1 rounded-full text-xs font-medium border border-orange-100 dark:border-orange-900">{order.items}</span>}
                  </div>
                  <div className="flex gap-2 mt-4 justify-end">
                    <button
                      type="button"
                      onClick={e => { e.stopPropagation(); openOrderDetail(order); }}
                      className="bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 font-semibold px-3 py-1 rounded-lg shadow text-xs border border-gray-200 dark:border-gray-700 transition flex items-center gap-1"
                    >
                      <FontAwesomeIcon icon={faClipboardList} /> Voir
                    </button>
                    <button
                      type="button"
                      onClick={e => { e.stopPropagation(); window.open(`/orders/edit/${order.id}`, '_blank'); }}
                      className="bg-orange-500 hover:bg-orange-600 text-white font-semibold px-4 py-2 rounded-lg shadow text-xs flex items-center gap-1 transition"
                    >
                      <FontAwesomeIcon icon={faEdit} /> Modifier
                    </button>
                    {linkedLivraison && (
                      <button
                        type="button"
                        onClick={e => { e.stopPropagation(); window.location.href = `/delivery/${linkedLivraison.id}`; }}
                        className="bg-green-100 hover:bg-green-200 text-green-800 font-semibold px-4 py-2 rounded-lg shadow text-xs flex items-center gap-1 transition"
                      >
                        <FontAwesomeIcon icon={faTruck} /> Livraison
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
        {tab === 'non_controle' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {commandesNonControle.length === 0 ? (
              <div className="col-span-2 text-center py-12 text-gray-400 italic">Aucune commande non contrôlée</div>
            ) : commandesNonControle.map((order: any) => {
              const linkedLivraison = linkedLivraisons.find((l: any) => l.numBC === order.numBC);
              let borderColor = 'border-gray-400';
              let badge = 'Non contrôlé';
              if (linkedLivraison?.conformite === 'litige') { borderColor = 'border-red-400'; badge = 'Litige'; }
              if (linkedLivraison?.conformite === 'back_order') { borderColor = 'border-yellow-400'; badge = 'Back order'; }
              return (
                <div key={order.id} className={`group relative rounded-2xl shadow-xl bg-white/70 dark:bg-gray-900/70 border-l-8 ${borderColor} p-6 flex flex-col gap-4 hover:scale-[1.02] hover:shadow-2xl transition-all duration-200 cursor-pointer backdrop-blur`} onClick={e => {
                  if ((e.target as HTMLElement).closest('button')) return;
                  openOrderDetail(order);
                }}>
                  <div className="flex flex-col gap-2">
                    <div className="flex flex-wrap items-center gap-3 mb-1">
                      <span className="inline-flex items-center gap-2 text-base font-semibold text-orange-600"><FontAwesomeIcon icon={faBoxOpen} /> {order.fournisseur?.name || 'Fournisseur inconnu'}</span>
                      <span className="inline-flex items-center gap-2 text-xs text-gray-500"><FontAwesomeIcon icon={faClipboardList} /> BC : {order.numBC}</span>
                      <span className="inline-flex items-center gap-2 text-xs text-gray-500">Service : {order.service?.name || 'N/A'}</span>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="inline-flex items-center gap-2 text-xs text-gray-400">Ajouté le {order.createdAt ? new Date(order.createdAt).toLocaleDateString('fr-FR') : '-'}</span>
                      {linkedLivraison && (
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${conformityBadge(linkedLivraison.conformite)}`} title={linkedLivraison.conformite}><FontAwesomeIcon icon={faCheckCircle} className="mr-1" />{badge}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {Array.isArray(order.items) ? order.items.map((item: any, idx: number) => (
                      <span key={idx} className="inline-block bg-orange-50 dark:bg-gray-800 text-orange-700 dark:text-orange-300 px-3 py-1 rounded-full text-xs font-medium border border-orange-100 dark:border-orange-900">{item}</span>
                    )) : <span className="inline-block bg-orange-50 dark:bg-gray-800 text-orange-700 dark:text-orange-300 px-3 py-1 rounded-full text-xs font-medium border border-orange-100 dark:border-orange-900">{order.items}</span>}
                  </div>
                  <div className="flex gap-2 mt-4 justify-end">
                    <button
                      type="button"
                      onClick={e => { e.stopPropagation(); openOrderDetail(order); }}
                      className="bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 font-semibold px-3 py-1 rounded-lg shadow text-xs border border-gray-200 dark:border-gray-700 transition flex items-center gap-1"
                    >
                      <FontAwesomeIcon icon={faClipboardList} /> Voir
                    </button>
                    <button
                      type="button"
                      onClick={e => { e.stopPropagation(); window.open(`/orders/edit/${order.id}`, '_blank'); }}
                      className="bg-orange-500 hover:bg-orange-600 text-white font-semibold px-4 py-2 rounded-lg shadow text-xs flex items-center gap-1 transition"
                    >
                      <FontAwesomeIcon icon={faEdit} /> Modifier
                    </button>
                    {linkedLivraison && (
                      <button
                        type="button"
                        onClick={e => { e.stopPropagation(); window.location.href = `/delivery/${linkedLivraison.id}`; }}
                        className="bg-green-100 hover:bg-green-200 text-green-800 font-semibold px-4 py-2 rounded-lg shadow text-xs flex items-center gap-1 transition"
                      >
                        <FontAwesomeIcon icon={faTruck} /> Livraison
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      <Transition.Root show={modalOpen} as={React.Fragment}>
        <Dialog as="div" className="relative z-50" onClose={closeOrderDetail}>
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
              <Dialog.Panel className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl p-8 max-w-2xl w-full border border-gray-200 dark:border-gray-800">
                <Dialog.Title className="text-lg font-bold text-orange-500 mb-4 flex items-center gap-2">
                  <FontAwesomeIcon icon={faClipboardList} /> Détail du bon de commande
                </Dialog.Title>
                {orderDetail && (
                  <>
                    {/* ... autres infos du BC ... */}
                    {/* Affichage des livraisons liées */}
                    <div className="mb-4">
                      <h3 className="text-base font-bold text-gray-900 dark:text-white mb-2">Livraisons liées à ce BC</h3>
                      {linkedLivraisons && Array.isArray(linkedLivraisons) && linkedLivraisons.filter(l => l.numBC === orderDetail.numBC).length > 0 ? (
                        <div className="flex flex-wrap gap-3">
                          {linkedLivraisons.filter(l => l.numBC === orderDetail.numBC).map((l: any) => (
                            <div key={l.id} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2 shadow flex flex-col min-w-[220px]">
                              <div className="font-bold text-orange-600">Livraison du {new Date(l.dateLivraison).toLocaleDateString()} à {l.heureArrivee}</div>
                              <div className="text-xs text-gray-500">Conformité : <span className="font-semibold">{l.conformite}</span></div>
                              <button type="button" onClick={() => window.location.href = `/delivery/${l.id}`} className="mt-2 text-orange-500 hover:underline text-xs font-semibold">Voir la livraison</button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-gray-500">Aucune livraison liée à ce BC.</div>
                      )}
                    </div>
                  </>
                )}
                <div className="flex justify-end mt-6">
                  <button onClick={closeOrderDetail} className="px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600 font-semibold shadow">Fermer</button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </Dialog>
      </Transition.Root>
    </HeaderLayout>
  );
} 