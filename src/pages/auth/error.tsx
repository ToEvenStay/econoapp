import { useRouter } from "next/router";

export default function AuthError() {
  const { query } = useRouter();
  const error = Array.isArray(query.error)
    ? query.error[0]
    : query.error;

  return (
    <main className="p-8">
      <h1 className="text-2xl font-bold mb-4">Erreur d’authentification</h1>
      <p className="mb-2">Code d’erreur : <strong>{error}</strong></p>
      <p>Vérifie ta configuration Google (Client ID/Secret, URIs, Test Users…).</p>
    </main>
  );
} 