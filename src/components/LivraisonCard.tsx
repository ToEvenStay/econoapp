import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faClock, faBuilding, faClipboardList, faSnowflake } from '@fortawesome/free-solid-svg-icons';
import clsx from 'clsx';

export interface LivraisonCardProps {
  livraison: any;
  linkedOrder?: any;
  onClick?: () => void;
  onVoirBC?: () => void;
}

export const LivraisonCard: React.FC<LivraisonCardProps> = ({ livraison: l, linkedOrder, onClick, onVoirBC }) => (
  <div className={clsx(
    'group relative rounded-2xl shadow-xl bg-white/70 dark:bg-gray-900/70 border-l-8 p-4 flex flex-col gap-2 hover:scale-[1.02] hover:shadow-2xl transition-all duration-200 cursor-pointer backdrop-blur mb-8 max-w-3xl mx-auto',
    l.conformite === 'conforme' && 'border-green-400',
    l.conformite === 'litige' && 'border-red-400',
    l.conformite === 'back_order' && 'border-yellow-400',
    l.conformite === 'non_controle' && 'border-gray-400',
    !['conforme','litige','back_order','non_controle'].includes(l.conformite) && 'border-orange-300'
  )} onClick={onClick}>
    <div className="flex flex-col min-w-0 gap-1 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex-1 flex flex-col min-w-0 gap-1">
        <div className="flex items-center gap-2 min-w-0">
          <h3 className="font-bold text-gray-900 text-base truncate max-w-[180px]">{l.fournisseur?.name}</h3>
          <span className="text-xs text-gray-500 flex items-center gap-1"><FontAwesomeIcon icon={faClock} /> {l.heureArrivee?.slice(0,5)}</span>
        </div>
        {l.numBC && (
          <div className="flex items-center gap-2 mt-0.5">
            <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-orange-100 text-orange-700 border border-orange-200">BC: {l.numBC}</span>
            {l.numBC && linkedOrder && (
              <button
                type="button"
                onClick={e => { e.stopPropagation(); onVoirBC && onVoirBC(); }}
                className="text-blue-600 hover:underline text-xs font-semibold flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-100 border border-blue-200"
              >
                <FontAwesomeIcon icon={faClipboardList} className="w-4 h-4" /> Voir BC
              </button>
            )}
          </div>
        )}
        <div className="flex items-center gap-2 mt-0.5">
          <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-gray-700 border border-gray-200"><FontAwesomeIcon icon={faBuilding} /> {l.service?.name}</span>
          {linkedOrder?.destination && (
            <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">{linkedOrder.destination}</span>
          )}
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          <span className={clsx('inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full',
            l.type === 'alimentaire'
              ? 'bg-green-50 text-green-700 border border-green-200'
              : 'bg-gray-100 text-gray-700 border border-gray-200')}>{l.type === 'alimentaire' ? 'Alimentaire' : 'Non alimentaire'}</span>
          {l.type === 'alimentaire' && l.tempFrais != null && l.tempFrais !== '' && l.tempFrais !== 0 && l.tempFrais !== '0' && (
            <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">Frais: {l.tempFrais}°C</span>
          )}
          {l.type === 'alimentaire' && l.tempCongele != null && l.tempCongele !== '' && l.tempCongele !== 0 && l.tempCongele !== '0' && (
            <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200"><FontAwesomeIcon icon={faSnowflake} /> Congelé: {l.tempCongele}°C</span>
          )}
        </div>
      </div>
      <div className="flex items-center justify-center h-full ml-4">
        <span className={clsx('px-5 py-2 rounded-full text-lg font-bold shadow',
          l.conformite === 'conforme' && 'bg-green-100 text-green-800',
          l.conformite === 'litige' && 'bg-red-100 text-red-800',
          l.conformite === 'back_order' && 'bg-yellow-100 text-yellow-800',
          l.conformite === 'non_controle' && 'bg-gray-100 text-gray-800',
          !['conforme','litige','back_order','non_controle'].includes(l.conformite) && 'bg-blue-100 text-blue-800')}>{l.conformite?.charAt(0).toUpperCase() + l.conformite?.slice(1)}</span>
      </div>
    </div>
  </div>
); 