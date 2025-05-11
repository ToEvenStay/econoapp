import React, { useEffect } from 'react';
import useSWR from 'swr';
import { useRouter } from 'next/router';
import HeaderLayout from '@/components/HeaderLayout';
import { useSession } from "next-auth/react";

const fetcher = (url: string) => fetch(url).then(r => r.json());

export default function DeliveryDetailPage() {
  const { status } = useSession();
  const router = useRouter();
  const { id } = router.query;
  const { data: livraison, isLoading } = useSWR(id ? `/api/delivery/${id}` : null, fetcher);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/api/auth/signin");
    }
  }, [status, router]);

  if (status === "loading") {
    return <div>Chargement...</div>;
  }

  // Chercher le bon de commande lié à cette livraison (par numBC)
  const linkedOrder = useSWR(livraison?.numBC ? `/api/orders?numBC=${encodeURIComponent(livraison.numBC)}` : null, fetcher).data?.[0];

  if (isLoading || !livraison) {
    return <HeaderLayout><div className="max-w-2xl mx-auto px-4 py-8 text-center text-gray-400">Chargement…</div></HeaderLayout>;
  }

  return (
    <HeaderLayout>
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-orange-500">Détail de la livraison</h1>
          <div className="flex gap-2">
            <button onClick={() => router.push(`/delivery/edit/${id}`)} className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 font-semibold shadow">Modifier</button>
            <button
              onClick={async () => {
                if (window.confirm('Supprimer cette livraison ?')) {
                  await fetch(`/api/delivery/${id}`, { method: 'DELETE' });
                  router.push('/delivery/controle');
                }
              }}
              className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 font-semibold shadow"
            >
              Supprimer
            </button>
            <button onClick={() => router.push('/delivery/controle')} className="text-gray-500 hover:text-orange-500">Retour</button>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-900 rounded-xl shadow p-6 border border-gray-200 dark:border-gray-800 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <div className="text-sm text-gray-500">Fournisseur</div>
              <div className="font-semibold text-lg text-orange-600 dark:text-orange-400">{livraison.fournisseur?.name}</div>
            </div>
            <div>
              <div className="text-sm text-gray-500">Service</div>
              <div className="font-semibold">{livraison.service?.name}</div>
            </div>
            <div>
              <div className="text-sm text-gray-500">Date</div>
              <div>{new Date(livraison.dateLivraison).toLocaleDateString('fr-FR')}</div>
            </div>
            <div>
              <div className="text-sm text-gray-500">Heure d'arrivée</div>
              <div>{livraison.heureArrivee?.slice(0,5)}</div>
            </div>
            <div>
              <div className="text-sm text-gray-500">Type</div>
              <div>{livraison.type}</div>
            </div>
            <div>
              <div className="text-sm text-gray-500">Conformité</div>
              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${livraison.conformite === 'conforme' ? 'bg-green-100 text-green-800' : livraison.conformite === 'litige' ? 'bg-red-100 text-red-800' : livraison.conformite === 'back_order' ? 'bg-yellow-100 text-yellow-800' : livraison.conformite === 'non_controle' ? 'bg-gray-100 text-gray-800' : 'bg-blue-100 text-blue-800'}`}>{livraison.conformite}</span>
            </div>
            {livraison.type === 'alimentaire' && (
              <>
                {livraison.tempFrais && Number(livraison.tempFrais) !== 0 && (
                  <div>
                    <div className="text-sm text-gray-500">Température frais</div>
                    <div>{livraison.tempFrais} °C</div>
                  </div>
                )}
                {livraison.tempCongele && Number(livraison.tempCongele) !== 0 && (
                  <div>
                    <div className="text-sm text-gray-500">Température congelé</div>
                    <div>{livraison.tempCongele} °C</div>
                  </div>
                )}
              </>
            )}
            {livraison.numBC && (
              <div>
                <div className="text-sm text-gray-500">Numéro BC</div>
                <div className="flex items-center gap-2">
                  <span>{livraison.numBC}</span>
                  {linkedOrder && (
                    <>
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-semibold">Lié à un bon de commande</span>
                      <button
                        type="button"
                        onClick={() => router.push(`/orders/edit/${linkedOrder.id}`)}
                        className="bg-blue-100 hover:bg-blue-200 text-blue-800 font-semibold px-3 py-1 rounded-lg shadow text-xs"
                      >
                        Voir le bon de commande
                      </button>
                    </>
                  )}
                </div>
              </div>
            )}
            {livraison.numBL && (
              <div>
                <div className="text-sm text-gray-500">Numéro BL</div>
                <div>{livraison.numBL}</div>
              </div>
            )}
          </div>
          {livraison.remarques && (
            <div className="mb-4">
              <div className="text-sm text-gray-500">Remarques générales</div>
              <div className="italic text-gray-700 dark:text-gray-300">{livraison.remarques}</div>
            </div>
          )}
        </div>
        <div className="bg-white dark:bg-gray-900 rounded-xl shadow p-6 border border-gray-200 dark:border-gray-800">
          <h2 className="text-lg font-semibold mb-4">Articles livrés</h2>
          <div className="space-y-2">
            {livraison.articles && livraison.articles.length > 0 ? livraison.articles.map((a: any, i: number) => (
              <div key={i} className="grid grid-cols-1 md:grid-cols-6 gap-2 bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                <div className="font-semibold md:col-span-2">{a.nom}</div>
                <div>{a.quantite}</div>
                <div>{a.reference}</div>
                <div><span className={`px-2 py-1 rounded text-xs font-semibold ${a.conformite === 'conforme' ? 'bg-green-100 text-green-800' : a.conformite === 'litige' ? 'bg-red-100 text-red-800' : a.conformite === 'back_order' ? 'bg-yellow-100 text-yellow-800' : a.conformite === 'non_controle' ? 'bg-gray-100 text-gray-800' : 'bg-blue-100 text-blue-800'}`}>{a.conformite}</span></div>
                <div className="italic text-xs text-gray-500">{a.remarques}</div>
              </div>
            )) : <div className="text-gray-400">Aucun article</div>}
          </div>
        </div>
      </div>
    </HeaderLayout>
  );
} 