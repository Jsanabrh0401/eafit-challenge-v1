/** Sube una imagen a ImgBB y devuelve una URL https (requiere NEXT_PUBLIC_IMGBB_API_KEY). */
export async function uploadImageToImgbb(file: File): Promise<string> {
  const key = process.env.NEXT_PUBLIC_IMGBB_API_KEY;
  if (!key?.trim()) {
    throw new Error(
      "Configura NEXT_PUBLIC_IMGBB_API_KEY en el frontend para subir imágenes.",
    );
  }

  const base64 = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const r = reader.result;
      if (typeof r !== "string") {
        reject(new Error("No se pudo leer el archivo."));
        return;
      }
      const comma = r.indexOf(",");
      resolve(comma >= 0 ? r.slice(comma + 1) : r);
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });

  const body = new FormData();
  body.append("key", key);
  body.append("image", base64);

  const res = await fetch("https://api.imgbb.com/1/upload", {
    method: "POST",
    body,
  });
  const data = (await res.json()) as {
    success?: boolean;
    data?: { url?: string; display_url?: string };
    error?: { message?: string };
  };

  if (!data.success || !data.data?.url) {
    throw new Error(data.error?.message ?? "ImgBB rechazó la imagen.");
  }

  return data.data.url;
}
