import React, { useState } from 'react';
import useSWR from 'swr';
import HeaderLayout from '../components/HeaderLayout';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSearch, faPlus, faBoxOpen } from '@fortawesome/free-solid-svg-icons';

const fetcher = (url: string) => fetch(url).then(res => res.json());

export default function StockPage() {
  // États pour les filtres
  const [filters, setFilters] = useState({
    query: '',
    service: 'tout',
    type_produit: '',
    expiration: 'all',
    categorie_alimentaire: '',
  });

  // Construction de la query string pour l'API
  const params = new URLSearchParams();
  if (filters.query) params.append('query', filters.query);
  if (filters.service && filters.service !== 'tout') params.append('service', filters.service);
  if (filters.type_produit) params.append('type_produit', filters.type_produit);
  if (filters.expiration && filters.expiration !== 'all') params.append('expiration', filters.expiration);
  if (filters.categorie_alimentaire) params.append('categorie_alimentaire', filters.categorie_alimentaire);

  // Récupération des produits
  const { data: products, isLoading: loadingProducts } = useSWR(`/api/stock?${params.toString()}`, fetcher);
  // Récupération des services
  const { data: services } = useSWR('/api/services', fetcher);

  // Gestion du changement de filtre
  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  return (
    <HeaderLayout>
      <main className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col items-center py-8 px-2">
        {/* Header minimal */}
        <h1 className="text-3xl md:text-4xl font-semibold text-center text-gray-900 dark:text-white mb-8 tracking-tight">Gestion du stock</h1>

        {/* Barre de filtres sticky */}
        <section className="w-full max-w-5xl sticky top-4 z-10 mb-8">
          <form className="flex flex-col md:flex-row gap-2 md:gap-4 bg-white/80 dark:bg-gray-800/80 backdrop-blur rounded-xl shadow border border-gray-200 dark:border-gray-700 px-4 py-3 items-center">
            <div className="relative flex-1 w-full">
              <FontAwesomeIcon icon={faSearch} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                name="query"
                value={filters.query}
                onChange={handleFilterChange}
                placeholder="Rechercher..."
                className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-transparent text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-400"
                autoComplete="off"
              />
            </div>
            <select
              name="service"
              value={filters.service}
              onChange={handleFilterChange}
              className="rounded-lg border border-gray-200 dark:border-gray-700 bg-transparent text-gray-900 dark:text-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-400"
            >
              <option value="tout">Tous les services</option>
              {services && services.map((service: any) => (
                <option key={service.name} value={service.name}>{service.name}</option>
              ))}
            </select>
            <select
              name="type_produit"
              value={filters.type_produit}
              onChange={handleFilterChange}
              className="rounded-lg border border-gray-200 dark:border-gray-700 bg-transparent text-gray-900 dark:text-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-400"
            >
              <option value="">Tous les types</option>
              <option value="alimentaire">Alimentaire</option>
              <option value="non_alimentaire">Non alimentaire</option>
            </select>
            <select
              name="expiration"
              value={filters.expiration}
              onChange={handleFilterChange}
              className="rounded-lg border border-gray-200 dark:border-gray-700 bg-transparent text-gray-900 dark:text-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-400"
            >
              <option value="all">Tous les états</option>
              <option value="expired">Périmés</option>
              <option value="expiring">À péremption proche</option>
            </select>
            {filters.type_produit === 'alimentaire' && (
              <select
                name="categorie_alimentaire"
                value={filters.categorie_alimentaire}
                onChange={handleFilterChange}
                className="rounded-lg border border-gray-200 dark:border-gray-700 bg-transparent text-gray-900 dark:text-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-400"
              >
                <option value="">Toutes catégories</option>
                <option value="sec">Sec</option>
                <option value="frais">Frais</option>
                <option value="congele">Congelé</option>
              </select>
            )}
            <button type="button" className="ml-auto flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg font-semibold shadow transition">
              <FontAwesomeIcon icon={faPlus} />
              <span className="hidden sm:inline">Nouveau</span>
            </button>
          </form>
        </section>

        {/* Grille de produits minimaliste */}
        <section className="w-full max-w-5xl flex-1">
          {loadingProducts ? (
            <div className="flex flex-col items-center justify-center py-24">
              <span className="animate-spin text-4xl text-orange-400 mb-4"><FontAwesomeIcon icon={faBoxOpen} /></span>
              <span className="text-gray-400">Chargement des produits...</span>
            </div>
          ) : products && products.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6">
              {products.map((item: any) => (
                <div key={item.id} className="group bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-800 rounded-xl shadow-sm hover:shadow-lg transition p-5 flex flex-col gap-2 min-h-[160px]">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-orange-100 dark:bg-orange-900 text-orange-500 dark:text-orange-300">
                      <FontAwesomeIcon icon={faBoxOpen} />
                    </span>
                    <span className="font-semibold text-gray-900 dark:text-white text-lg truncate" title={item.name}>{item.name}</span>
                  </div>
                  <div className="flex-1 flex flex-col gap-1 text-sm text-gray-500 dark:text-gray-300">
                    <span>Quantité : <span className="font-medium text-gray-900 dark:text-white">{item.quantity}</span> {item.unit}</span>
                    {item.service && <span>Service : <span className="font-medium text-gray-900 dark:text-white">{item.service}</span></span>}
                    {item.type_produit && <span>Type : <span className="font-medium text-gray-900 dark:text-white">{item.type_produit}</span></span>}
                    {item.expiration && <span>Péremption : <span className="font-medium text-gray-900 dark:text-white">{item.expiration}</span></span>}
                  </div>
                  <div className="flex justify-end mt-2">
                    <button className="text-orange-500 hover:text-orange-600 dark:hover:text-orange-300 p-2 rounded transition" title="Éditer">
                      <FontAwesomeIcon icon={faPlus} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-24">
              <span className="text-5xl text-gray-300 mb-4"><FontAwesomeIcon icon={faBoxOpen} /></span>
              <span className="text-gray-400">Aucun produit trouvé</span>
            </div>
          )}
        </section>
      </main>
    </HeaderLayout>
  );
} 