"use client";

import { uploadImageToImgbb } from "@/lib/imgbb";
import { useRef, useState } from "react";

type Props = {
  value: string;
  onChange: (url: string) => void;
  error?: string | null;
};

export function PhotoUrlField({ value, onChange, error }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadErr, setUploadErr] = useState<string | null>(null);
  const hasImgbb = Boolean(process.env.NEXT_PUBLIC_IMGBB_API_KEY?.trim());

  const displaySrc = value?.trim() || preview;

  async function onPickFile(file: File) {
    setUploadErr(null);
    if (!file.type.startsWith("image/")) {
      setUploadErr("Selecciona un archivo de imagen.");
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      setUploadErr("La imagen debe pesar menos de 8 MB.");
      return;
    }

    const url = URL.createObjectURL(file);
    setPreview(url);

    if (!hasImgbb) {
      setUploadErr(
        "Sin API de ImgBB: pega una URL https pública (p. ej. Imgur, tu CDN) o configura NEXT_PUBLIC_IMGBB_API_KEY.",
      );
      return;
    }

    setUploading(true);
    try {
      const httpsUrl = await uploadImageToImgbb(file);
      onChange(httpsUrl);
      URL.revokeObjectURL(url);
      setPreview(null);
    } catch (e) {
      setUploadErr(e instanceof Error ? e.message : "Error al subir.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
        Imagen del agente
      </label>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
        <div className="relative flex h-36 w-36 shrink-0 items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed border-zinc-300 bg-zinc-50 dark:border-zinc-600 dark:bg-zinc-900/60">
          {displaySrc ? (
            <img
              src={displaySrc}
              alt="Vista previa"
              className="h-full w-full object-cover"
            />
          ) : (
            <span className="px-2 text-center text-xs text-zinc-500">
              Sin imagen
            </span>
          )}
          {uploading && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/40 text-xs font-medium text-white">
              Subiendo…
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1 space-y-2">
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void onPickFile(f);
              e.target.value = "";
            }}
          />
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-indigo-500 disabled:opacity-60"
            >
              Elegir archivo
            </button>
            {value?.trim() && (
              <button
                type="button"
                onClick={() => {
                  onChange("");
                  setPreview(null);
                  setUploadErr(null);
                }}
                className="rounded-lg border border-zinc-300 px-4 py-2 text-sm dark:border-zinc-600"
              >
                Quitar URL
              </button>
            )}
          </div>
          <input
            type="url"
            placeholder="O pega aquí una URL https de la imagen"
            value={value}
            onChange={(e) => {
              onChange(e.target.value);
              setUploadErr(null);
            }}
            className="w-full rounded-xl border border-zinc-300 bg-white px-4 py-3 text-sm outline-none ring-indigo-500/30 transition focus:border-indigo-500 focus:ring-4 dark:border-zinc-600 dark:bg-zinc-950 mt-5"
          />
        </div>
      </div>

      {(uploadErr || error) && (
        <p className="text-sm text-red-600 dark:text-red-400">{uploadErr || error}</p>
      )}
    </div>
  );
}
