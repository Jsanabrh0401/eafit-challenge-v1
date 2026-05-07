"use client";

import { useAuth } from "@/contexts/auth-context";
import { apiGithubAuth } from "@/lib/api";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

function GithubCallbackContent() {
  const router = useRouter();
  const params = useSearchParams();
  const { login } = useAuth();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function run() {
      const code = params.get("code");
      const state = params.get("state");
      const expected = sessionStorage.getItem("github_oauth_state");
      sessionStorage.removeItem("github_oauth_state");

      if (!code) {
        setError("GitHub no devolvió código de autorización.");
        return;
      }
      if (!state || !expected || state !== expected) {
        setError("Estado OAuth inválido. Intenta de nuevo.");
        return;
      }

      try {
        const data = await apiGithubAuth(code);
        login(data);
        router.replace("/dashboard");
      } catch (e) {
        setError(e instanceof Error ? e.message : "Error al autenticar con GitHub.");
      }
    }
    void run();
  }, [params, login, router]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-950 p-6 text-zinc-100">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-zinc-900/80 p-6 text-center">
        <h1 className="text-xl font-semibold">Conectando con GitHub…</h1>
        {!error ? (
          <p className="mt-3 text-sm text-zinc-400">Estamos validando tu cuenta.</p>
        ) : (
          <>
            <p className="mt-3 text-sm text-red-400">{error}</p>
            <Link href="/login" className="mt-4 inline-block text-sm text-indigo-400 underline">
              Volver a login
            </Link>
          </>
        )}
      </div>
    </main>
  );
}

export default function GithubCallbackPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center bg-zinc-950 p-6 text-zinc-100">
          <div className="w-full max-w-md rounded-2xl border border-white/10 bg-zinc-900/80 p-6 text-center">
            <h1 className="text-xl font-semibold">Conectando con GitHub…</h1>
            <p className="mt-3 text-sm text-zinc-400">Estamos validando tu cuenta.</p>
          </div>
        </main>
      }
    >
      <GithubCallbackContent />
    </Suspense>
  );
}
