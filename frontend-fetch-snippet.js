// пример подключения к dream-foto.ru

async function requestRetouchPreview({ file, selected, intensity }) {
  const form = new FormData();
  form.append("image", file);
  form.append("effects", JSON.stringify([...selected]));
  form.append("intensity", String(intensity));

  const response = await fetch("https://retouch-api.vercel.app/api/retouch", {
    method: "POST",
    body: form
  });

  if (!response.ok) {
    let payload;
    try {
      payload = await response.json();
    } catch {
      payload = { message: "Unknown error" };
    }
    throw new Error(payload.message || payload.error || "Retouch request failed");
  }

  const blob = await response.blob();
  return {
    blob,
    url: URL.createObjectURL(blob),
    generationMs: response.headers.get("X-Retouch-Generation-Ms")
  };
}
