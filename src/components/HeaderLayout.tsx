import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '../lib/useAuth';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBars, faBell, faHome, faBoxOpen, faPeopleCarry, faShoppingCart, faClipboardList, faTruckLoading, faUserCog, faUserCircle, faMoon, faSun, faShoppingBasket, faTruck } from '@fortawesome/free-solid-svg-icons';

// Nécessite d'avoir installé @fortawesome/react-fontawesome et @fortawesome/free-solid-svg-icons

export default function HeaderLayout({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const isAdmin = true;
  const username = user?.name || user?.email || '';

  // Avatar minimal (initiale)
  const avatar = username ? username[0].toUpperCase() : '?';

  return (
    <>
      {/* Navbar mobile minimaliste */}
      <nav className="lg:hidden fixed top-0 inset-x-0 h-14 bg-white/90 dark:bg-gray-900/90 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between px-4 z-40 backdrop-blur">
        <button onClick={() => setSidebarOpen(true)} className="text-gray-500 dark:text-gray-300 hover:text-orange-500 focus:outline-none">
          <FontAwesomeIcon icon={faBars} size="lg" />
        </button>
        <Link href="/" className="text-xl font-bold text-orange-500 tracking-tight">ECOgestion</Link>
        <div className="flex items-center gap-2">
          <button className="text-gray-500 dark:text-gray-300 hover:text-orange-500 focus:outline-none">
            <FontAwesomeIcon icon={faBell} size="lg" />
          </button>
          <button onClick={() => setProfileOpen(v => !v)} className="ml-1 w-8 h-8 rounded-full bg-orange-100 dark:bg-orange-900 flex items-center justify-center text-orange-500 font-bold text-lg">
            {avatar}
          </button>
        </div>
      </nav>

      {/* Sidebar mobile slide-in */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 flex">
          <div className="w-64 bg-white dark:bg-gray-900 h-full shadow-xl flex flex-col p-6">
            <div className="mb-8 text-center">
              <Link href="/" className="text-2xl font-extrabold text-orange-500">ECOgestion</Link>
            </div>
            <nav className="flex-1 flex flex-col gap-2">
              <Link href="/" className="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition"><FontAwesomeIcon icon={faHome} /> Tableau de bord</Link>
              <Link href="/stock" className="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition"><FontAwesomeIcon icon={faBoxOpen} /> Stock</Link>
              <Link href="/stock/order" className="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition"><FontAwesomeIcon icon={faPeopleCarry} /> Commande stock</Link>
              <Link href="/order/new" className="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition"><FontAwesomeIcon icon={faShoppingCart} /> Passer commande</Link>
              <Link href="/order/list" className="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition"><FontAwesomeIcon icon={faClipboardList} /> Liste commandes</Link>
              <Link href="/orders/incoming" className="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition"><FontAwesomeIcon icon={faClipboardList} /> CmD à venir</Link>
              <Link href="/delivery/controle" className="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition"><FontAwesomeIcon icon={faTruckLoading} /> Contrôle livraison</Link>
              {isAdmin && (
                <Link href="/admin" className="flex items-center gap-3 px-3 py-2 rounded-lg bg-orange-500 text-white font-semibold hover:bg-orange-600 transition"><FontAwesomeIcon icon={faUserCog} /> Admin</Link>
              )}
            </nav>
            <button onClick={() => setSidebarOpen(false)} className="mt-8 text-gray-400 hover:text-orange-500">Fermer</button>
          </div>
          <div className="flex-1 bg-black/30" onClick={() => setSidebarOpen(false)} />
        </div>
      )}

      {/* Sidebar gauche (desktop) modern minimal */}
      <aside className="hidden lg:flex flex-col h-screen fixed left-0 top-0 w-20 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 z-40 items-center py-6 gap-4 shadow-sm">
        {/* Logo en haut */}
        <Link href="/" className="mb-4 flex items-center justify-center">
          <img src="/uploads/logo/abm-logo.png" alt="Logo ABM" className="w-12 h-12 object-contain" />
        </Link>
        <nav className="flex flex-col gap-4 flex-1 items-center w-full">
          <Link href="/" className="group flex flex-col items-center gap-1 text-gray-400 hover:text-orange-500 transition" title="Accueil"><FontAwesomeIcon icon={faHome} size="lg" /><span className="text-xs">Accueil</span></Link>
          <Link href="/stock" className="group flex flex-col items-center gap-1 text-gray-400 hover:text-orange-500 transition" title="Stock"><FontAwesomeIcon icon={faBoxOpen} size="lg" /><span className="text-xs">Stock</span></Link>
          <Link href="/stock/order" className="group flex flex-col items-center gap-1 text-gray-400 hover:text-orange-500 transition" title="Commande stock"><FontAwesomeIcon icon={faPeopleCarry} size="lg" /><span className="text-xs">Cmd stock</span></Link>
          <Link href="/order/new" className="group flex flex-col items-center gap-1 text-gray-400 hover:text-orange-500 transition" title="Passer commande"><FontAwesomeIcon icon={faShoppingCart} size="lg" /><span className="text-xs">Commander</span></Link>
          <Link href="/order/list" className="group flex flex-col items-center gap-1 text-gray-400 hover:text-orange-500 transition" title="Liste commandes"><FontAwesomeIcon icon={faClipboardList} size="lg" /><span className="text-xs">Commandes</span></Link>
          <Link href="/orders/incoming" className="group flex flex-col items-center gap-1 text-gray-400 hover:text-orange-500 transition" title="Livraisons à venir"><FontAwesomeIcon icon={faTruck} size="lg" /><span className="text-xs">CmD à venir</span></Link>
          <Link href="/delivery/controle" className="group flex flex-col items-center gap-1 text-gray-400 hover:text-orange-500 transition" title="Contrôle livraison"><FontAwesomeIcon icon={faTruckLoading} size="lg" /><span className="text-xs">Livraison</span></Link>
          {isAdmin && (
            <Link href="/admin" className="group flex flex-col items-center gap-1 text-orange-500 hover:text-orange-600 transition font-bold" title="Admin"><FontAwesomeIcon icon={faUserCog} size="lg" /><span className="text-xs">Admin</span></Link>
          )}
        </nav>
        {/* Notifications et panier en bas, juste au-dessus du profil */}
        <div className="flex flex-col items-center gap-3 mb-2 mt-auto">
          <button className="text-gray-500 dark:text-gray-300 hover:text-orange-500 focus:outline-none" title="Notifications">
            <FontAwesomeIcon icon={faBell} size="lg" />
          </button>
          <button className="text-gray-500 dark:text-gray-300 hover:text-orange-500 focus:outline-none" title="Panier">
            <FontAwesomeIcon icon={faShoppingBasket} size="lg" />
          </button>
        </div>
        {/* Profil tout en bas */}
        <div className="flex flex-col items-center gap-2 mt-2 mb-0">
          <button onClick={() => setProfileOpen(v => !v)} className="w-10 h-10 rounded-full bg-orange-100 dark:bg-orange-900 flex items-center justify-center text-orange-500 font-bold text-lg border-2 border-orange-200 dark:border-orange-800">
            {avatar}
          </button>
          {profileOpen && (
            <div className="absolute left-24 bottom-8 min-w-[12rem] bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow animate-fade-in z-50 p-4 flex flex-col gap-2">
              <span className="font-semibold text-gray-900 dark:text-white mb-2">{username}</span>
              <Link href="/profile" className="block px-4 py-2 text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded">Mon Profil</Link>
              <button onClick={() => logout()} className="block w-full text-left px-4 py-2 text-red-500 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">Déconnexion</button>
            </div>
          )}
        </div>
      </aside>

      {/* Main content wrapper (desktop) */}
      <main className="main-content min-h-screen bg-gray-50 dark:bg-gray-900 lg:pl-20">
        {children}
      </main>
    </>
  );
} 