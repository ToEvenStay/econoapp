import useSWR from 'swr';
import { useMemo } from 'react';

export function useLivraisons(filters: any) {
  const fetcher = (url: string) => fetch(url).then(r => r.json());
  const { data: livraisons = [], isLoading } = useSWR(`/api/delivery?${new URLSearchParams(filters)}`, fetcher);
  const numBCs = useMemo(
    () => Array.isArray(livraisons)
      ? Array.from(new Set(livraisons.map((l: any) => l.numBC).filter(Boolean)))
      : [],
    [livraisons]
  );
  const { data: linkedOrders = [] } = useSWR(
    numBCs.length ? `/api/orders?numBCs=${encodeURIComponent(JSON.stringify(numBCs))}` : null,
    fetcher
  );
  return { livraisons, isLoading, linkedOrders };
} 