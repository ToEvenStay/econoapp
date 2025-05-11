import React, { useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/router';
import HeaderLayout from '../components/HeaderLayout';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUserCircle } from '@fortawesome/free-solid-svg-icons';

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/api/auth/signin");
    }
  }, [status, router]);

  if (status === 'loading') return <div className="min-h-screen flex items-center justify-center text-gray-400 bg-gray-900">Chargement...</div>;
  if (!session) return <div className="min-h-screen flex items-center justify-center text-gray-400 bg-gray-900">Non connecté</div>;

  const avatar = session.user?.name?.[0]?.toUpperCase() || session.user?.email?.[0]?.toUpperCase() || '?';

  return (
    <HeaderLayout>
      <main className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col items-center py-12 px-2">
        <h1 className="text-3xl md:text-4xl font-semibold text-center text-gray-900 dark:text-white mb-8 tracking-tight">Mon profil</h1>
        <section className="w-full max-w-md mx-auto">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-8 flex flex-col items-center gap-6">
            <div className="w-24 h-24 rounded-full bg-orange-100 dark:bg-orange-900 flex items-center justify-center text-5xl text-orange-500 dark:text-orange-300 font-bold shadow">
              {avatar}
            </div>
            <div className="flex flex-col items-center gap-1">
              <span className="text-xl font-semibold text-gray-900 dark:text-white">{session.user?.name || '—'}</span>
              <span className="text-gray-500 dark:text-gray-300">{session.user?.email}</span>
            </div>
            <button
              onClick={() => signOut({ callbackUrl: '/' })}
              className="mt-4 bg-orange-500 hover:bg-orange-600 text-white px-6 py-2 rounded-lg font-semibold shadow transition"
            >
              Se déconnecter
            </button>
          </div>
        </section>
      </main>
    </HeaderLayout>
  );
} 