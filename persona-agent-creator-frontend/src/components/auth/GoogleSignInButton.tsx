"use client";

import Script from "next/script";
import { useEffect, useRef, useState } from "react";

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string;
            callback: (resp: { credential: string }) => void;
          }) => void;
          renderButton: (
            el: HTMLElement,
            config: Record<string, string | number | boolean>,
          ) => void;
        };
      };
    };
  }
}

const CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? "";

type Props = {
  onCredential: (credential: string) => void;
};

export function GoogleSignInButton({ onCredential }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const cbRef = useRef(onCredential);
  cbRef.current = onCredential;
  const [gsiLoaded, setGsiLoaded] = useState(false);
  const renderedRef = useRef(false);

  useEffect(() => {
    if (window.google) {
      setGsiLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (!gsiLoaded || !CLIENT_ID || !containerRef.current || !window.google) return;
    if (renderedRef.current) return;
    renderedRef.current = true;

    window.google.accounts.id.initialize({
      client_id: CLIENT_ID,
      callback: (resp: { credential: string }) => {
        cbRef.current(resp.credential);
      },
    });

    window.google.accounts.id.renderButton(containerRef.current, {
      theme: "outline",
      size: "large",
      width: 320,
      text: "continue_with",
      locale: "es",
      shape: "rectangular",
    });
  }, [gsiLoaded]);

  if (!CLIENT_ID) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-center text-sm text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-100">
        Para usar &quot;Continuar con Google&quot;, configura{" "}
        <code className="rounded bg-amber-100 px-1 font-mono text-xs dark:bg-amber-900/80">
          NEXT_PUBLIC_GOOGLE_CLIENT_ID
        </code>{" "}
        en el proyecto (consola Google Cloud → OAuth Web client).
      </div>
    );
  }

  return (
    <>
      <Script
        src="https://accounts.google.com/gsi/client"
        async
        defer
        onLoad={() => setGsiLoaded(true)}
        onReady={() => setGsiLoaded(true)}
      />
      <div className="flex min-h-[44px] justify-center" ref={containerRef} />
    </>
  );
}
