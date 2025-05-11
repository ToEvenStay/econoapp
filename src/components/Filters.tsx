import React, { ChangeEvent } from 'react';

export interface FiltersProps {
  filters: any;
  fournisseurs: any[];
  services: any[];
  conformiteStatus: any[];
  onChange: (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  onReset: () => void;
  onNew: () => void;
  hideSearchAndAdd?: boolean;
}

export const Filters: React.FC<FiltersProps> = ({ filters, fournisseurs, services, conformiteStatus, onChange, onReset, onNew, hideSearchAndAdd }) => (
  <div className="bg-gray-50 p-6 rounded-xl mb-8 border border-gray-200">
    <h2 className="text-lg font-semibold mb-3 flex items-center">
      Filtres
    </h2>
    <form className="flex flex-col gap-4" onSubmit={e => e.preventDefault()}>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Date début</label>
        <input type="date" name="dateDebut" value={filters.dateDebut} onChange={onChange} className="w-full rounded-lg border border-gray-300 shadow-sm focus:border-orange-500 focus:ring-2 focus:ring-orange-500 bg-white px-3 py-2 transition" />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Date fin</label>
        <input type="date" name="dateFin" value={filters.dateFin} onChange={onChange} className="w-full rounded-lg border border-gray-300 shadow-sm focus:border-orange-500 focus:ring-2 focus:ring-orange-500 bg-white px-3 py-2 transition" />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Fournisseur</label>
        <select name="fournisseurId" value={filters.fournisseurId} onChange={onChange} className="w-full rounded-lg border border-gray-300 shadow-sm focus:border-orange-500 focus:ring-2 focus:ring-orange-500 bg-white px-3 py-2 transition">
          <option value="">Tous</option>
          {Array.isArray(fournisseurs) && fournisseurs.map((f: any) => <option key={f.id} value={f.id}>{f.name}</option>)}
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Service</label>
        <select name="serviceId" value={filters.serviceId} onChange={onChange} className="w-full rounded-lg border border-gray-300 shadow-sm focus:border-orange-500 focus:ring-2 focus:ring-orange-500 bg-white px-3 py-2 transition">
          <option value="">Tous</option>
          {Array.isArray(services) && services.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Conformité</label>
        <select name="conformite" value={filters.conformite} onChange={onChange} className="w-full rounded-lg border border-gray-300 shadow-sm focus:border-orange-500 focus:ring-2 focus:ring-orange-500 bg-white px-3 py-2 transition">
          <option value="">Toutes</option>
          {Array.isArray(conformiteStatus) && conformiteStatus.map((s: any) => {
            const code = s.code || s.label.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase().replace(/\s+/g, '_');
            return (
              <option key={s.id} value={code}>{s.label.charAt(0).toUpperCase() + s.label.slice(1)}</option>
            );
          })}
        </select>
      </div>
    </form>
  </div>
); 