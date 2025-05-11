import React, { useState } from 'react';
import { useSession, signIn } from 'next-auth/react';
import useSWR, { mutate } from 'swr';
import HeaderLayout from '../components/HeaderLayout';
import { Tab } from '@headlessui/react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faUser, faUsers, faTruck, faUserCog } from '@fortawesome/free-solid-svg-icons';

const fetcher = (url: string) => fetch(url).then(res => res.json());

export default function AdminPage() {
  const { data: session, status } = useSession();
  const [activeTab, setActiveTab] = useState<'users' | 'services' | 'fournisseurs' | 'options' | 'superadmin'>('users');
  const [serviceName, setServiceName] = useState('');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const { data: services, isLoading } = useSWR('/api/services', fetcher);

  // Utilisateurs
  const { data: users, isLoading: loadingUsers, mutate: mutateUsers } = useSWR('/api/users', fetcher);
  const [userEmail, setUserEmail] = useState('');
  const [userName, setUserName] = useState('');
  const [userFeedback, setUserFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Fournisseurs
  const { data: fournisseurs, isLoading: loadingFournisseurs, mutate: mutateFournisseurs } = useSWR('/api/fournisseurs', fetcher);
  const [fournisseurForm, setFournisseurForm] = useState<any>({ name: '', email: '', phone: '', address: '', type: 'ALIMENTAIRE', logo: null });
  const [editFournisseur, setEditFournisseur] = useState<any>(null);
  const [fournisseurFeedback, setFournisseurFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [showFournisseurModal, setShowFournisseurModal] = useState(false);

  // Recherche et filtre fournisseurs
  const [fournisseurSearch, setFournisseurSearch] = useState('');
  const [fournisseurTypeFilter, setFournisseurTypeFilter] = useState('TOUS');
  const filteredFournisseurs = (fournisseurs || []).filter((f: any) => {
    const matchType = fournisseurTypeFilter === 'TOUS' || f.type === fournisseurTypeFilter;
    const q = fournisseurSearch.toLowerCase();
    const matchSearch =
      f.name.toLowerCase().includes(q) ||
      (f.email && f.email.toLowerCase().includes(q)) ||
      (f.phone && f.phone.toLowerCase().includes(q)) ||
      (f.address && f.address.toLowerCase().includes(q));
    return matchType && matchSearch;
  });

  // Recherche live services
  const [serviceSearch, setServiceSearch] = useState('');
  const filteredServices = (services || []).filter((s: any) => s.name.toLowerCase().includes(serviceSearch.toLowerCase()));

  // Edition utilisateur
  const [editUser, setEditUser] = useState<any>(null);
  const [userEditForm, setUserEditForm] = useState<any>({ name: '', email: '' });
  const [userEditFeedback, setUserEditFeedback] = useState<string | null>(null);

  // Utilisateurs : recherche live et modal d'ajout
  const [userSearch, setUserSearch] = useState('');
  const [showUserModal, setShowUserModal] = useState(false);
  const filteredUsers = (users || []).filter((u: any) => {
    const q = userSearch.toLowerCase();
    return (
      (u.name && u.name.toLowerCase().includes(q)) ||
      (u.email && u.email.toLowerCase().includes(q))
    );
  });

  // Ajout d'un état pour la modal d'ajout de service
  const [showServiceModal, setShowServiceModal] = useState(false);

  // Ajout d'un état pour la modal d'édition de service
  const [editService, setEditService] = useState<any>(null);
  const [serviceEditName, setServiceEditName] = useState('');
  const [serviceEditFeedback, setServiceEditFeedback] = useState<string | null>(null);

  // Options : gestion des statuts de conformité (persistant BDD via API)
  const [newStatus, setNewStatus] = useState('');
  const [statusSearch, setStatusSearch] = useState('');
  const [optionsSearch, setOptionsSearch] = useState('');
  const { data: conformiteStatus, mutate: mutateConformite, isLoading: loadingConformite } = useSWR('/api/conformite-status', (url) => fetch(url).then(r => r.json()));
  const filteredStatus = (conformiteStatus || []).filter((s: any) => s.label.toLowerCase().includes(statusSearch.toLowerCase()));
  const filteredOptions = [
    { key: 'statut', label: 'Statuts de conformité' },
    { key: 'export', label: 'Export' },
  ].filter(opt => opt.label.toLowerCase().includes(optionsSearch.toLowerCase()));

  // Gestion des accès utilisateurs
  const [accessUser, setAccessUser] = useState<any>(null);
  const [accessModalOpen, setAccessModalOpen] = useState(false);
  // Liste des pages protégées (modifiable dans l'onglet Superadmin)
  const [protectedPages, setProtectedPages] = useState<string[]>(['admin', 'stock', 'services', 'fournisseurs', 'options']);

  const allPages = ['admin', 'stock', 'services', 'fournisseurs', 'options'];

  // Fonction pour télécharger un PDF d'export
  const handleExport = async (type: string) => {
    const res = await fetch(`/api/export?type=${type}`);
    if (!res.ok) return alert("Erreur lors de l'export");
    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${type}.pdf`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
  };

  // Redirection si non connecté
  if (status === 'loading') return <div className="min-h-screen flex items-center justify-center text-gray-400 bg-gray-900">Chargement...</div>;
  if (!session) {
    signIn();
    return <div className="min-h-screen flex items-center justify-center text-gray-400 bg-gray-900">Redirection...</div>;
  }

  // Ajout d'un service
  const handleAddService = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);
    if (!serviceName.trim()) {
      setFeedback({ type: 'error', message: 'Le nom du service est requis.' });
      return;
    }
    try {
      const res = await fetch('/api/services', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: serviceName.trim() }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Erreur lors de l\'ajout');
      }
      setServiceName('');
      setFeedback({ type: 'success', message: 'Service ajouté avec succès !' });
      mutateUsers();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message });
    }
  };

  // Ajout d'un utilisateur
  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setUserFeedback(null);
    if (!userEmail.trim()) {
      setUserFeedback({ type: 'error', message: 'Email requis.' });
      return;
    }
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: userEmail.trim(), name: userName.trim() }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Erreur lors de l\'ajout');
      }
      setUserEmail('');
      setUserName('');
      setUserFeedback({ type: 'success', message: 'Utilisateur ajouté !' });
      mutateUsers();
    } catch (err: any) {
      setUserFeedback({ type: 'error', message: err.message });
    }
  };

  // Suppression d'un utilisateur
  const handleDeleteUser = async (id: string) => {
    if (!confirm('Supprimer cet utilisateur ?')) return;
    try {
      const res = await fetch('/api/users', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      if (!res.ok) throw new Error('Erreur lors de la suppression');
      mutateUsers();
    } catch (err) {
      alert('Erreur lors de la suppression');
    }
  };

  // Ajout/édition fournisseur
  const handleFournisseurSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFournisseurFeedback(null);
    const formData = new FormData();
    Object.entries(fournisseurForm).forEach(([key, value]) => {
      if (value !== null && value !== undefined) {
        if (key === 'type') {
          formData.append(key, Array.isArray(value) ? String(value[0]) : String(value));
        } else if (key === 'logo' && value instanceof File) {
          formData.append(key, value);
        } else {
          formData.append(key, String(value));
        }
      }
    });
    if (editFournisseur) {
      // Supprime tout id déjà présent (par sécurité)
      formData.delete('id');
      formData.append('id', editFournisseur.id);
    }
    try {
      const res = await fetch('/api/fournisseurs', {
        method: editFournisseur ? 'PUT' : 'POST',
        body: formData,
      });
      if (!res.ok) throw new Error((await res.json()).error || 'Erreur');
      setFournisseurForm({ name: '', email: '', phone: '', address: '', type: 'ALIMENTAIRE', logo: null });
      setEditFournisseur(null);
      setShowFournisseurModal(false);
      mutateFournisseurs();
      setFournisseurFeedback({ type: 'success', message: editFournisseur ? 'Fournisseur modifié !' : 'Fournisseur ajouté !' });
    } catch (err: any) {
      setFournisseurFeedback({ type: 'error', message: err.message });
    }
  };
  const handleFournisseurDelete = async (id: React.MouseEvent<HTMLButtonElement>) => {
    if (!confirm('Supprimer ce fournisseur ?')) return;
    await fetch(`/api/fournisseurs?id=${id}`, { method: 'DELETE' });
    mutateFournisseurs();
  };
  const openEditFournisseur = (f: any) => {
    setEditFournisseur(f);
    setFournisseurForm({ ...f, logo: null });
    setShowFournisseurModal(true);
  };

  // Edition utilisateur
  const handleUserEdit = (user: any) => {
    setEditUser(user);
    setUserEditForm({ name: user.name || '', email: user.email });
    setUserEditFeedback(null);
  };
  const handleUserEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUserEditFeedback(null);
    try {
      const res = await fetch('/api/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: editUser.id, name: userEditForm.name, email: userEditForm.email }),
      });
      if (!res.ok) throw new Error((await res.json()).error || 'Erreur');
      setEditUser(null);
      mutateUsers();
    } catch (err: any) {
      setUserEditFeedback(err.message);
    }
  };

  // Ouvre la modal d'accès pour un user
  const openAccessModal = (user: any) => {
    setAccessUser(user);
    setAccessModalOpen(true);
  };
  // Met à jour les accès d'un user
  const handleAccessChange = async (page: string, checked: boolean) => {
    if (!accessUser) return;
    const newAccess = checked
      ? [...(accessUser.access || []), page]
      : (accessUser.access || []).filter((p: string) => p !== page);
    await fetch('/api/users', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: accessUser.id, access: newAccess }),
    });
    mutateUsers();
    setAccessUser({ ...accessUser, access: newAccess });
  };
  // Ajoute ou retire une page protégée (superadmin)
  const handleProtectedPageChange = (page: string, checked: boolean) => {
    setProtectedPages(checked ? [...protectedPages, page] : protectedPages.filter(p => p !== page));
  };

  return (
    <HeaderLayout>
      <main className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col items-center py-12 px-2">
        <h1 className="text-3xl md:text-4xl font-semibold text-center text-gray-900 dark:text-white mb-8 tracking-tight">Espace administration</h1>
        <section className="w-full max-w-2xl mx-auto">
          <Tab.Group selectedIndex={activeTab === 'users' ? 0 : activeTab === 'services' ? 1 : activeTab === 'fournisseurs' ? 2 : activeTab === 'options' ? 3 : 4} onChange={i => setActiveTab(i === 0 ? 'users' : i === 1 ? 'services' : i === 2 ? 'fournisseurs' : i === 3 ? 'options' : 'superadmin')}>
            <Tab.List className="flex space-x-2 bg-gray-100 dark:bg-gray-800 p-1 rounded-full w-fit mx-auto mb-10 shadow border border-gray-200 dark:border-gray-700">
              <Tab className={({ selected }) => `px-5 py-2.5 text-sm font-semibold rounded-full transition focus:outline-none flex items-center gap-2
                ${selected ? 'bg-orange-500 text-white shadow' : 'text-gray-500 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'}`}> <FontAwesomeIcon icon={faUsers}/> Utilisateurs</Tab>
              <Tab className={({ selected }) => `px-5 py-2.5 text-sm font-semibold rounded-full transition focus:outline-none flex items-center gap-2
                ${selected ? 'bg-orange-500 text-white shadow' : 'text-gray-500 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'}`}> <FontAwesomeIcon icon={faPlus}/> Services</Tab>
              <Tab className={({ selected }) => `px-5 py-2.5 text-sm font-semibold rounded-full transition focus:outline-none flex items-center gap-2
                ${selected ? 'bg-orange-500 text-white shadow' : 'text-gray-500 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'}`}> <FontAwesomeIcon icon={faTruck}/> Fournisseurs</Tab>
              <Tab className={({ selected }) => `px-5 py-2.5 text-sm font-semibold rounded-full transition focus:outline-none flex items-center gap-2
                ${selected ? 'bg-orange-500 text-white shadow' : 'text-gray-500 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'}`}> <FontAwesomeIcon icon={faUserCog}/> Options</Tab>
              <Tab className={({ selected }) => `px-5 py-2.5 text-sm font-semibold rounded-full transition focus:outline-none flex items-center gap-2
                ${selected ? 'bg-orange-500 text-white shadow' : 'text-gray-500 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'}`}> <FontAwesomeIcon icon={faUser}/> Superadmin</Tab>
            </Tab.List>
            <Tab.Panels>
              <Tab.Panel>
                {/* Onglet Utilisateurs */}
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
                  <h2 className="text-lg font-bold text-gray-900 dark:text-white">Utilisateurs</h2>
                  <div className="flex gap-2 flex-1 md:justify-end">
                    <input type="text" value={userSearch} onChange={e => setUserSearch(e.target.value)} placeholder="Recherche..." className="rounded-lg border border-gray-200 dark:border-gray-700 px-3 py-2 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400" />
                    <button onClick={() => { setShowUserModal(true); setUserEditForm({ name: '', email: '' }); setEditUser(null); }} className="bg-orange-500 text-white px-4 py-2 rounded-lg font-semibold hover:bg-orange-600 transition shadow flex items-center gap-2"><FontAwesomeIcon icon={faPlus}/> Ajouter</button>
                  </div>
                </div>
                <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Liste des utilisateurs</h2>
                {loadingUsers ? (
                  <div className="text-gray-400 dark:text-gray-500">Chargement...</div>
                ) : (
                  <ul className="divide-y divide-gray-200 dark:divide-gray-800">
                    {filteredUsers && filteredUsers.length > 0 ? (
                      filteredUsers.map((user: any) => (
                        <li key={user.id} className="py-2 flex items-center justify-between text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg px-2 transition">
                          <span>{user.name || user.email}</span>
                          <div className="flex gap-2">
                            <button onClick={() => handleUserEdit(user)} className="text-orange-500 hover:text-orange-600 dark:hover:text-orange-300 px-2">Éditer</button>
                            <button onClick={() => handleDeleteUser(user.id)} className="text-red-500 hover:text-red-400 text-sm">Supprimer</button>
                            <button onClick={() => openAccessModal(user)} className="text-blue-500 hover:text-blue-600 dark:hover:text-blue-300 px-2">Accès</button>
                          </div>
                        </li>
                      ))
                    ) : (
                      <li className="py-2 text-gray-400 dark:text-gray-500">Aucun utilisateur.</li>
                    )}
                  </ul>
                )}
                {/* Modal ajout/édition utilisateur */}
                {showUserModal && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
                    <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-8 w-full max-w-md mx-auto flex flex-col gap-6 relative">
                      <button onClick={() => { setShowUserModal(false); setEditUser(null); }} className="absolute top-2 right-2 text-gray-400 hover:text-orange-500">✕</button>
                      {editUser ? (
                        <>
                          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Modifier l'utilisateur</h3>
                          <form onSubmit={handleUserEditSubmit} className="flex flex-col gap-4">
                            <input type="text" value={userEditForm.name} onChange={e => setUserEditForm((f: any) => ({ ...f, name: e.target.value }))} placeholder="Nom" className="rounded-lg border border-gray-200 dark:border-gray-700 px-4 py-2 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400" />
                            <input type="email" value={userEditForm.email} onChange={e => setUserEditForm((f: any) => ({ ...f, email: e.target.value }))} placeholder="Email" className="rounded-lg border border-gray-200 dark:border-gray-700 px-4 py-2 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400" />
                            <button type="submit" className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2 rounded-lg font-semibold shadow transition">Enregistrer</button>
                            {userEditFeedback && <div className="mt-2 px-4 py-2 rounded-lg text-sm font-medium bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300">{userEditFeedback}</div>}
                          </form>
                        </>
                      ) : (
                        <>
                          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Ajouter un utilisateur</h3>
                          <form onSubmit={handleAddUser} className="flex flex-col gap-4">
                            <input type="text" value={userName} onChange={e => setUserName(e.target.value)} placeholder="Nom" className="rounded-lg border border-gray-200 dark:border-gray-700 px-4 py-2 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400" />
                            <input type="email" value={userEmail} onChange={e => setUserEmail(e.target.value)} placeholder="Email" className="rounded-lg border border-gray-200 dark:border-gray-700 px-4 py-2 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400" />
                            <button type="submit" className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2 rounded-lg font-semibold shadow transition">Ajouter</button>
                            {userFeedback && <div className={`mt-2 px-4 py-2 rounded-lg text-sm font-medium ${userFeedback.type === 'success' ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' : 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'}`}>{userFeedback.message}</div>}
                          </form>
                        </>
                      )}
                    </div>
                  </div>
                )}
                {/* Modal gestion des accès utilisateur */}
                {accessModalOpen && accessUser && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
                    <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-8 w-full max-w-md mx-auto flex flex-col gap-6 relative">
                      <button onClick={() => setAccessModalOpen(false)} className="absolute top-2 right-2 text-gray-400 hover:text-orange-500">✕</button>
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Accès de {accessUser.name || accessUser.email}</h3>
                      {accessUser.email === 'bry' ? (
                        <div className="text-green-600 dark:text-green-400 font-semibold">Cet utilisateur a tous les accès (superadmin)</div>
                      ) : (
                        <form className="flex flex-col gap-3">
                          {protectedPages.map(page => (
                            <label key={page} className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                checked={Array.isArray(accessUser.access) && accessUser.access.includes(page)}
                                onChange={e => handleAccessChange(page, e.target.checked)}
                                className="accent-orange-500"
                                disabled={accessUser.email === 'bry'}
                              />
                              <span className="capitalize">{page}</span>
                            </label>
                          ))}
                        </form>
                      )}
                    </div>
                  </div>
                )}
              </Tab.Panel>
              <Tab.Panel>
                {/* Onglet Services */}
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-lg font-bold text-gray-900 dark:text-white">Services</h2>
                  <div className="flex gap-2 flex-1 justify-end">
                    <input type="text" value={serviceSearch} onChange={e => setServiceSearch(e.target.value)} placeholder="Recherche..." className="rounded-lg border border-gray-200 dark:border-gray-700 px-3 py-2 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 ml-2" />
                    <button onClick={() => setShowServiceModal(true)} className="bg-orange-500 text-white px-4 py-2 rounded-lg font-semibold hover:bg-orange-600 transition shadow flex items-center gap-2"><FontAwesomeIcon icon={faPlus}/> Ajouter</button>
                  </div>
                </div>
                {/* Modal ajout service */}
                {showServiceModal && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
                    <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-8 w-full max-w-md mx-auto flex flex-col gap-6 relative">
                      <button onClick={() => setShowServiceModal(false)} className="absolute top-2 right-2 text-gray-400 hover:text-orange-500">✕</button>
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Ajouter un service</h3>
                      <form onSubmit={async (e) => { await handleAddService(e); setShowServiceModal(false); }} className="flex flex-col gap-4">
                        <input
                          id="serviceName"
                          type="text"
                          value={serviceName}
                          onChange={e => setServiceName(e.target.value)}
                          className="rounded-lg border border-gray-200 dark:border-gray-700 focus:border-orange-500 focus:ring-1 focus:ring-orange-400 px-4 py-2 transition text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-900 placeholder-gray-400"
                          placeholder="Nom du service"
                          required
                        />
                        <button type="submit" className="bg-orange-500 text-white px-6 py-2 rounded-lg font-semibold hover:bg-orange-600 transition shadow">Ajouter</button>
                        {feedback && (
                          <div className={`mt-2 px-4 py-2 rounded-lg text-sm font-medium ${feedback.type === 'success' ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' : 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'}`}>{feedback.message}</div>
                        )}
                      </form>
                    </div>
                  </div>
                )}
                <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Liste des services</h2>
                {isLoading ? (
                  <div className="text-gray-400 dark:text-gray-500">Chargement...</div>
                ) : (
                  <ul className="divide-y divide-gray-200 dark:divide-gray-800">
                    {filteredServices && filteredServices.length > 0 ? (
                      filteredServices.map((service: any) => (
                        <li key={service.id} className="py-2 flex items-center justify-between text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg px-2 transition">
                          <span>{service.name}</span>
                          <div className="flex gap-2">
                            <button onClick={() => { setEditService(service); setServiceEditName(service.name); setServiceEditFeedback(null); }} className="text-orange-500 hover:text-orange-600 dark:hover:text-orange-300 px-2">Éditer</button>
                            <button onClick={async () => { if (confirm('Supprimer ce service ?')) { await fetch('/api/services', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: service.id }) }); mutate('/api/services'); } }} className="text-red-500 hover:text-red-400 text-sm">Supprimer</button>
                          </div>
                        </li>
                      ))
                    ) : (
                      <li className="py-2 text-gray-400 dark:text-gray-500">Aucun service enregistré.</li>
                    )}
                  </ul>
                )}
                {/* Modal édition service */}
                {editService && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
                    <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-8 w-full max-w-md mx-auto flex flex-col gap-6 relative">
                      <button onClick={() => setEditService(null)} className="absolute top-2 right-2 text-gray-400 hover:text-orange-500">✕</button>
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Modifier le service</h3>
                      <form onSubmit={async (e) => {
                        e.preventDefault();
                        setServiceEditFeedback(null);
                        if (!serviceEditName.trim()) {
                          setServiceEditFeedback('Le nom du service est requis.');
                          return;
                        }
                        const res = await fetch('/api/services', {
                          method: 'PUT',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ id: editService.id, name: serviceEditName.trim() })
                        });
                        if (!res.ok) {
                          const data = await res.json();
                          setServiceEditFeedback(data.error || 'Erreur lors de la modification');
                        } else {
                          setEditService(null);
                          mutate('/api/services');
                        }
                      }} className="flex flex-col gap-4">
                        <input
                          type="text"
                          value={serviceEditName}
                          onChange={e => setServiceEditName(e.target.value)}
                          className="rounded-lg border border-gray-200 dark:border-gray-700 focus:border-orange-500 focus:ring-1 focus:ring-orange-400 px-4 py-2 transition text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-900 placeholder-gray-400"
                          placeholder="Nom du service"
                          required
                        />
                        <button type="submit" className="bg-orange-500 text-white px-6 py-2 rounded-lg font-semibold hover:bg-orange-600 transition shadow">Enregistrer</button>
                        {serviceEditFeedback && <div className="mt-2 px-4 py-2 rounded-lg text-sm font-medium bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300">{serviceEditFeedback}</div>}
                      </form>
                    </div>
                  </div>
                )}
              </Tab.Panel>
              <Tab.Panel>
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
                  <h2 className="text-lg font-bold text-gray-900 dark:text-white">Fournisseurs</h2>
                  <div className="flex gap-2 flex-1 md:justify-end">
                    <input type="text" value={fournisseurSearch} onChange={e => setFournisseurSearch(e.target.value)} placeholder="Recherche..." className="rounded-lg border border-gray-200 dark:border-gray-700 px-3 py-2 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400" />
                    <select value={fournisseurTypeFilter} onChange={e => setFournisseurTypeFilter(e.target.value)} className="rounded-lg border border-gray-200 dark:border-gray-700 px-3 py-2 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white">
                      <option value="TOUS">Tous types</option>
                      <option value="ALIMENTAIRE">Alimentaire</option>
                      <option value="NON_ALIMENTAIRE">Non alimentaire</option>
                      <option value="LES_DEUX">Les deux</option>
                    </select>
                    <button onClick={() => { setShowFournisseurModal(true); setEditFournisseur(null); setFournisseurForm({ name: '', email: '', phone: '', address: '', type: 'ALIMENTAIRE', logo: null }); }} className="bg-orange-500 text-white px-4 py-2 rounded-lg font-semibold hover:bg-orange-600 transition shadow flex items-center gap-2"><FontAwesomeIcon icon={faPlus}/> Ajouter</button>
                  </div>
                </div>
                {loadingFournisseurs ? (
                  <div className="text-gray-400 dark:text-gray-500">Chargement...</div>
                ) : (
                  <ul className="divide-y divide-gray-200 dark:divide-gray-800">
                    {filteredFournisseurs && filteredFournisseurs.length > 0 ? filteredFournisseurs.map((f: any) => (
                      <li key={f.id} className="py-4 flex items-center gap-4 text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg px-2 transition">
                        {f.logo ? <img src={f.logo} alt="logo" className="w-12 h-12 rounded-full object-cover border border-gray-200 dark:border-gray-700" /> : <span className="w-12 h-12 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-2xl text-orange-500"><FontAwesomeIcon icon={faTruck}/></span>}
                        <div className="flex-1">
                          <div className="font-semibold">{f.name}</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">{f.type.replace('_', ' ').toLowerCase()}</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">{f.email}</div>
                        </div>
                        <button onClick={() => openEditFournisseur(f)} className="text-orange-500 hover:text-orange-600 dark:hover:text-orange-300 px-2">Éditer</button>
                        <button onClick={() => handleFournisseurDelete(f.id)} className="text-red-500 hover:text-red-400 px-2">Supprimer</button>
                      </li>
                    )) : <li className="py-4 text-gray-400 dark:text-gray-500">Aucun fournisseur.</li>}
                  </ul>
                )}
                {/* Modal ajout/édition fournisseur */}
                {showFournisseurModal && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
                    <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-8 w-full max-w-md mx-auto flex flex-col gap-6 relative">
                      <button onClick={() => setShowFournisseurModal(false)} className="absolute top-2 right-2 text-gray-400 hover:text-orange-500">✕</button>
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{editFournisseur ? 'Modifier' : 'Ajouter'} un fournisseur</h3>
                      <form onSubmit={handleFournisseurSubmit} className="flex flex-col gap-4">
                        <input type="text" name="name" value={fournisseurForm.name} onChange={e => setFournisseurForm((f: any) => ({ ...f, name: e.target.value }))} placeholder="Nom du fournisseur" className="rounded-lg border border-gray-200 dark:border-gray-700 px-4 py-2 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400" required />
                        <input type="email" name="email" value={fournisseurForm.email || ''} onChange={e => setFournisseurForm((f: any) => ({ ...f, email: e.target.value }))} placeholder="Email" className="rounded-lg border border-gray-200 dark:border-gray-700 px-4 py-2 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400" />
                        <input type="text" name="phone" value={fournisseurForm.phone || ''} onChange={e => setFournisseurForm((f: any) => ({ ...f, phone: e.target.value }))} placeholder="Téléphone" className="rounded-lg border border-gray-200 dark:border-gray-700 px-4 py-2 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400" />
                        <input type="text" name="address" value={fournisseurForm.address || ''} onChange={e => setFournisseurForm((f: any) => ({ ...f, address: e.target.value }))} placeholder="Adresse" className="rounded-lg border border-gray-200 dark:border-gray-700 px-4 py-2 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400" />
                        <select name="type" value={fournisseurForm.type} onChange={e => setFournisseurForm((f: any) => ({ ...f, type: String(e.target.value) }))} className="rounded-lg border border-gray-200 dark:border-gray-700 px-4 py-2 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white">
                          <option value="ALIMENTAIRE">Alimentaire</option>
                          <option value="NON_ALIMENTAIRE">Non alimentaire</option>
                          <option value="LES_DEUX">Les deux</option>
                        </select>
                        <input type="file" accept="image/*" onChange={e => setFournisseurForm((f: any) => ({ ...f, logo: e.target.files?.[0] || null }))} className="rounded-lg border border-gray-200 dark:border-gray-700 px-4 py-2 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white" />
                        {editFournisseur && editFournisseur.logo && (
                          <img src={editFournisseur.logo} alt="logo" className="w-16 h-16 rounded-full object-cover border border-gray-200 dark:border-gray-700 mx-auto" />
                        )}
                        <button type="submit" className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2 rounded-lg font-semibold shadow transition">{editFournisseur ? 'Modifier' : 'Ajouter'}</button>
                        {fournisseurFeedback && <div className={`mt-2 px-4 py-2 rounded-lg text-sm font-medium ${fournisseurFeedback.type === 'success' ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' : 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'}`}>{fournisseurFeedback.message}</div>}
                      </form>
                    </div>
                  </div>
                )}
              </Tab.Panel>
              <Tab.Panel>
                {/* Onglet Options */}
                <div className="max-w-xl mx-auto flex flex-col gap-8">
                  <input
                    type="text"
                    value={optionsSearch}
                    onChange={e => setOptionsSearch(e.target.value)}
                    placeholder="Recherche dans les options..."
                    className="mb-6 w-full rounded-lg border border-gray-200 dark:border-gray-700 px-4 py-2 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400"
                  />
                  {/* Bloc Statuts de conformité */}
                  {filteredOptions.some(opt => opt.key === 'statut') && (
                    <section className="bg-white dark:bg-gray-900 rounded-xl shadow border border-gray-200 dark:border-gray-700 p-6 flex flex-col gap-4">
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Statuts de conformité</h3>
                      <form onSubmit={async e => {
                        e.preventDefault();
                        if (!newStatus.trim()) return;
                        await fetch('/api/conformite-status', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ label: newStatus.trim() })
                        });
                        setNewStatus('');
                        mutateConformite();
                      }} className="flex gap-2 mb-4">
                        <input type="text" value={newStatus} onChange={e => setNewStatus(e.target.value)} placeholder="Ajouter un statut..." className="flex-1 rounded-lg border border-gray-200 dark:border-gray-700 px-3 py-2 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400" />
                        <button type="submit" className="bg-orange-500 text-white px-4 py-2 rounded-lg font-semibold hover:bg-orange-600 transition shadow">Ajouter</button>
                      </form>
                      <input type="text" value={statusSearch} onChange={e => setStatusSearch(e.target.value)} placeholder="Recherche statut..." className="mb-2 w-full rounded-lg border border-gray-200 dark:border-gray-700 px-3 py-2 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400" />
                      <ul className="divide-y divide-gray-200 dark:divide-gray-800">
                        {loadingConformite ? (
                          <li className="py-2 text-gray-400 dark:text-gray-500">Chargement...</li>
                        ) : filteredStatus.length > 0 ? filteredStatus.map((s: any) => (
                          <li key={s.id} className="py-2 flex items-center justify-between text-gray-900 dark:text-white">
                            <span>{s.label}</span>
                            <button onClick={async () => { await fetch(`/api/conformite-status?id=${s.id}`, { method: 'DELETE' }); mutateConformite(); }} className="text-red-500 hover:text-red-400 text-sm">Supprimer</button>
                          </li>
                        )) : <li className="py-2 text-gray-400 dark:text-gray-500">Aucun statut.</li>}
                      </ul>
                    </section>
                  )}
                  {/* Bloc Export */}
                  {filteredOptions.some(opt => opt.key === 'export') && (
                    <section className="bg-white dark:bg-gray-900 rounded-xl shadow border border-gray-200 dark:border-gray-700 p-6 flex flex-col gap-4">
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Export</h3>
                      <div className="flex gap-4">
                        <button onClick={() => handleExport('users')} className="bg-orange-500 text-white px-4 py-2 rounded-lg font-semibold hover:bg-orange-600 transition shadow">Exporter les utilisateurs (PDF)</button>
                        <button onClick={() => handleExport('services')} className="bg-orange-500 text-white px-4 py-2 rounded-lg font-semibold hover:bg-orange-600 transition shadow">Exporter les services (PDF)</button>
                        <button onClick={() => handleExport('fournisseurs')} className="bg-orange-500 text-white px-4 py-2 rounded-lg font-semibold hover:bg-orange-600 transition shadow">Exporter les fournisseurs (PDF)</button>
                      </div>
                      <p className="text-xs text-gray-400 mt-2">(Fonctionnalité à venir)</p>
                    </section>
                  )}
                </div>
              </Tab.Panel>
              <Tab.Panel>
                {/* Onglet Superadmin */}
                <div className="max-w-xl mx-auto flex flex-col gap-8">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Pages protégées</h2>
                  <form className="flex flex-col gap-3">
                    {allPages.map(page => (
                      <label key={page} className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={protectedPages.includes(page)}
                          onChange={e => handleProtectedPageChange(page, e.target.checked)}
                          className="accent-orange-500"
                        />
                        <span className="capitalize">{page}</span>
                      </label>
                    ))}
                  </form>
                  <div className="text-xs text-gray-400 mt-2">Les pages cochées nécessitent un accès explicite pour les utilisateurs (sauf bry).</div>
                </div>
              </Tab.Panel>
            </Tab.Panels>
          </Tab.Group>
        </section>
      </main>
    </HeaderLayout>
  );
} 