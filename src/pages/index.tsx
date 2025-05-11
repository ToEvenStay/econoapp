import React from 'react';
import Link from 'next/link';
import HeaderLayout from '../components/HeaderLayout';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBoxOpen, faPeopleCarry, faShoppingCart, faClipboardList, faTruckLoading, faUserCog, faUserShield, faTruck } from '@fortawesome/free-solid-svg-icons';

export default function HomePage() {
  // TODO: Remplacer par la vraie logique de permissions utilisateur
  const hasStockAccess = true;
  const hasOrderAccess = true;
  const hasListOrderAccess = true;
  const hasDeliveryAccess = true;
  const hasSuperadminAccess = true;
  const isAdmin = true;

  return (
    <HeaderLayout>
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex flex-col items-center py-12">
        <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-2xl mx-auto max-w-5xl pt-6 mt-8 w-full">
          <h1 className="text-3xl font-extrabold tracking-tight text-center mb-10 text-orange-500 dark:text-white">Tableau de bord</h1>
          <div id="eco-grid" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {hasStockAccess && (
              <>
                <Link href="/stock" className="eco-card block w-full bg-white dark:bg-gray-800 p-6 rounded-xl shadow hover:shadow-lg transition duration-200 border-l-4 border-orange-500 hover:bg-orange-50 dark:hover:bg-gray-700 group">
                  <div className="flex justify-center mb-4">
                    <FontAwesomeIcon icon={faBoxOpen} className="text-4xl text-orange-500 group-hover:text-orange-400 transition" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white text-center">Stock</h3>
                </Link>
                <Link href="/stock/order" className="eco-card block w-full bg-white dark:bg-gray-800 p-6 rounded-xl shadow hover:shadow-lg transition duration-200 border-l-4 border-orange-500 hover:bg-orange-50 dark:hover:bg-gray-700 group">
                  <div className="flex justify-center mb-4">
                    <FontAwesomeIcon icon={faPeopleCarry} className="text-4xl text-orange-500 group-hover:text-orange-400 transition" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white text-center">Commande du Stock</h3>
                </Link>
                {hasOrderAccess && (
                  <Link href="/order/new" className="eco-card block w-full bg-white dark:bg-gray-800 p-6 rounded-xl shadow hover:shadow-lg transition duration-200 border-l-4 border-orange-500 hover:bg-orange-50 dark:hover:bg-gray-700 group">
                    <div className="flex justify-center mb-4">
                      <FontAwesomeIcon icon={faShoppingCart} className="text-4xl text-orange-500 group-hover:text-orange-400 transition" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white text-center">Passer une commande</h3>
                  </Link>
                )}
              </>
            )}

            {hasListOrderAccess && (
              <Link href="/order/list" className="eco-card block w-full bg-white dark:bg-gray-800 p-6 rounded-xl shadow hover:shadow-lg transition duration-200 border-l-4 border-orange-500 hover:bg-orange-50 dark:hover:bg-gray-700 group">
                <div className="flex justify-center mb-4">
                  <FontAwesomeIcon icon={faClipboardList} className="text-4xl text-orange-500 group-hover:text-orange-400 transition" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white text-center">Liste des commandes</h3>
              </Link>
            )}

            {hasDeliveryAccess && (
              <>
                <Link href="/orders/incoming" className="eco-card block w-full bg-white dark:bg-gray-800 p-6 rounded-xl shadow hover:shadow-lg transition duration-200 border-l-4 border-orange-500 hover:bg-orange-50 dark:hover:bg-gray-700 group">
                  <div className="flex justify-center mb-4">
                    <FontAwesomeIcon icon={faTruck} className="text-4xl text-orange-500 group-hover:text-orange-400 transition" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white text-center">CmD à venir</h3>
                </Link>
                <Link href="/delivery/controle" className="eco-card block w-full bg-white dark:bg-gray-800 p-6 rounded-xl shadow hover:shadow-lg transition duration-200 border-l-4 border-orange-500 hover:bg-orange-50 dark:hover:bg-gray-700 group">
                  <div className="flex justify-center mb-4">
                    <FontAwesomeIcon icon={faTruckLoading} className="text-4xl text-orange-500 group-hover:text-orange-400 transition" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white text-center">Contrôle livraison</h3>
                </Link>
              </>
            )}

            {hasSuperadminAccess && (
              <>
                {isAdmin && (
                  <Link href="/admin" className="eco-card block w-full bg-white dark:bg-gray-800 p-6 rounded-xl shadow hover:shadow-lg transition duration-200 border-l-4 border-orange-500 hover:bg-orange-50 dark:hover:bg-gray-700 group">
                    <div className="flex justify-center mb-4">
                      <FontAwesomeIcon icon={faUserCog} className="text-4xl text-orange-500 group-hover:text-orange-400 transition" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white text-center">Admin</h3>
                  </Link>
                )}
                <Link href="/superadmin" className="eco-card block w-full bg-white dark:bg-gray-800 p-6 rounded-xl shadow hover:shadow-lg transition duration-200 border-l-4 border-orange-500 hover:bg-orange-50 dark:hover:bg-gray-700 group">
                  <div className="flex justify-center mb-4">
                    <FontAwesomeIcon icon={faUserShield} className="text-4xl text-orange-500 group-hover:text-orange-400 transition" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white text-center">Superadmin</h3>
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </HeaderLayout>
  );
}
