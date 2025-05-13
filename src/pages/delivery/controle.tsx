import React, { useState, useCallback, useMemo, useEffect } from 'react';
import HeaderLayout from '../../components/HeaderLayout';
import { Filters } from '../../components/Filters';
import { LivraisonCard } from '../../components/LivraisonCard';
import { useLivraisons } from '../../hooks/useLivraisons';
import useSWR, { mutate } from 'swr';
import { Dialog, Transition } from '@headlessui/react';
import { useRouter } from "next/router";
import { useAuth } from '../../lib/useAuth';

interface Fournisseur { id: string; name: string; }
interface Status { id: string; label: string; }

export default function ControleLivraisonsPage() {
  const router = useRouter();
  const { isAuthenticated, isReady } = useAuth();

  const today = useMemo(() => new Date(), []);
  const twoWeeksAgo = useMemo(() => { const d = new Date(); d.setDate(d.getDate() - 13); return d; }, []);
  const defaultDates = useMemo(() => ({
    dateDebut: twoWeeksAgo.toISOString().slice(0, 10),
    dateFin: today.toISOString().slice(0, 10),
  }), [twoWeeksAgo, today]);

  const [filters, setFilters] = useState({
    dateDebut: defaultDates.dateDebut,
    dateFin: defaultDates.dateFin,
    fournisseurId: '',
    serviceId: '',
    conformite: ''
  });

  const { data: fournisseurs = [] } = useSWR<Fournisseur[]>('/api/fournisseurs', (url: string) => fetch(url).then(r => r.json()));
  const { data: services = [] } = useSWR<any[]>('/api/services', (url: string) => fetch(url).then(r => r.json()));
  const { data: conformiteStatus = [] } = useSWR<Status[]>('/api/conformite-status', (url: string) => fetch(url).then(r => r.json()));

  const { livraisons, isLoading, linkedOrders } = useLivraisons(filters);

  const [search, setSearch] = useState('');

  useEffect(() => {
    if (isReady && !isAuthenticated) {
      router.push('/login');
    }
  }, [isReady, isAuthenticated, router]);

  if (!isReady) return null;

  console.log('Nombre de livraisons chargées :', livraisons.length);

  const filteredLivraisons = useMemo(() => {
    console.log('filteredLivraisons recalculé');
    let result = livraisons;
    if (filters.conformite) {
      const filtre = (filters.conformite || '').trim().toLowerCase();
      result = result.filter((l: any) => {
        const valeur = (l.conformite || '').trim().toLowerCase();
        const match = valeur === filtre;
        console.log('Filtre:', filtre, '| Livraison:', valeur, '| Match:', match);
        return match;
      });
    }
    if (filters.serviceId) {
      result = result.filter((l: any) => l.service?.id === filters.serviceId);
    }
    if (search) {
      const q = search.toLowerCase();
      result = result.filter((l: any) =>
        (l.fournisseur?.name || '').toLowerCase().includes(q) ||
        (l.numBC || '').toLowerCase().includes(q) ||
        (l.numBL || '').toLowerCase().includes(q) ||
        (l.remarques || '').toLowerCase().includes(q)
      );
    }
    return result;
  }, [livraisons, search, filters.conformite, filters.serviceId]);

  const grouped = useMemo(() => {
    return Array.isArray(filteredLivraisons)
      ? filteredLivraisons.reduce((acc: any, l: any) => {
          const date = l.dateLivraison?.slice(0, 10);
          if (!acc[date]) acc[date] = [];
          acc[date].push(l);
          return acc;
        }, {})
      : {};
  }, [filteredLivraisons]);
  const dates = useMemo(() => Object.keys(grouped).sort((a, b) => b.localeCompare(a)), [grouped]);

  const getLinkedOrder = useCallback((numBC: string) => linkedOrders.find((o: any) => o.numBC === numBC), [linkedOrders]);

  const handleFilterChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFilters(f => ({ ...f, [e.target.name]: e.target.value }));
  }, []);
  const handleReset = useCallback(() => {
    setFilters({ ...defaultDates, fournisseurId: '', serviceId: '', conformite: '' });
  }, [defaultDates]);
  const handleNew = useCallback(() => {
    window.location.href = '/delivery/add';
  }, []);

  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [loadingDelete, setLoadingDelete] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const handleDelete = async () => {
    if (!deleteId) return;
    setLoadingDelete(true);
    await fetch(`/api/delivery/${deleteId}`, { method: 'DELETE' });
    setLoadingDelete(false);
    setModalOpen(false);
    setDeleteId(null);
    mutate('/api/delivery');
    setFeedback('Livraison supprimée !');
    setTimeout(() => setFeedback(null), 2000);
  };

  return (
    <HeaderLayout>
      <div className="min-h-screen bg-gray-100 flex justify-center items-start py-8">
        <div className="relative">
          <div className="hidden md:block absolute right-full mr-6 top-0 w-72 bg-white rounded-2xl shadow-xl border border-gray-200 p-6 z-10">
            <Filters
              filters={filters}
              fournisseurs={fournisseurs}
              services={services}
              conformiteStatus={conformiteStatus}
              onChange={handleFilterChange}
              onReset={handleReset}
              onNew={handleNew}
              hideSearchAndAdd
            />
          </div>
          <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8 w-full max-w-3xl">
            <h1 className="text-3xl font-extrabold text-center text-orange-500 mb-8 tracking-tight">Contrôle des livraisons</h1>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Rechercher (fournisseur, n° BC, n° BL, remarques)"
                className="flex-grow w-full sm:w-auto pl-4 pr-4 py-2 rounded-lg border border-gray-300 shadow-sm focus:border-orange-500 focus:ring-2 focus:ring-orange-500 bg-white"
              />
              <button
                type="button"
                onClick={handleNew}
                className="bg-orange-500 text-white px-5 py-2 rounded-lg hover:bg-orange-600 font-semibold shadow"
              >
                Nouvelle livraison
              </button>
            </div>
            <div className="space-y-0">
              {isLoading ? (
                <div className="text-center py-12 text-gray-500">Chargement…</div>
              ) : dates.length === 0 ? (
                <div className="text-center py-12 text-gray-500">Aucune livraison trouvée pour ces critères</div>
              ) : (
                dates.map(date => {
                  const dateObj = new Date(date);
                  return (
                    <React.Fragment key={date}>
                      <div className="relative flex justify-center my-8" style={{ marginBottom: '2.5rem' }}>
                        <div className="absolute inset-0 flex items-center">
                          <div className="w-full border-t border-gray-300"></div>
                        </div>
                        <div className="relative px-6 py-1 bg-white rounded-full shadow border border-gray-200">
                          <span className="text-lg font-semibold text-gray-900">
                            {dateObj.toLocaleDateString('fr-FR')}
                            <span className="text-sm text-gray-500 font-normal ml-2">
                              {dateObj.toLocaleDateString('fr-FR', { weekday: 'long' })}
                            </span>
                          </span>
                        </div>
                      </div>
                      {grouped[date].map((l: any) => (
                        <LivraisonCard
                          key={l.id}
                          livraison={l}
                          linkedOrder={l.numBC && getLinkedOrder(l.numBC)}
                          onClick={() => window.location.href = `/delivery/${l.id}`}
                          onVoirBC={() => window.location.href = `/orders/edit/${getLinkedOrder(l.numBC)?.id}`}
                        />
                      ))}
                    </React.Fragment>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
      <Transition.Root show={modalOpen} as={React.Fragment}>
        <Dialog as="div" className="relative z-50" onClose={() => setModalOpen(false)}>
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
                <Dialog.Title className="text-lg font-bold text-red-600 mb-4 flex items-center gap-2">Confirmer la suppression</Dialog.Title>
                <Dialog.Description className="mb-6 text-gray-700 dark:text-gray-200">Voulez-vous vraiment supprimer cette livraison ? Cette action est irréversible.</Dialog.Description>
                <div className="flex justify-end gap-3">
                  <button onClick={() => setModalOpen(false)} className="px-4 py-2 border border-gray-300 dark:border-gray-700 rounded text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 font-semibold">Annuler</button>
                  <button onClick={handleDelete} disabled={loadingDelete} className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-60 font-semibold shadow">{loadingDelete ? 'Suppression…' : 'Supprimer'}</button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </Dialog>
      </Transition.Root>
    </HeaderLayout>
  );
} 