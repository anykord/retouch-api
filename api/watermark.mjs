import { MAX_FILE_BYTES } from "../lib/config.mjs";
import { applyPreviewWatermark } from "../lib/watermark.mjs";

function cleanSecret(raw) {
  return String(raw || "").split(/\r?\n/)[0].trim();
}

function isInternal(request) {
  const expected = cleanSecret(process.env.INTERNAL_API_KEY);
  const received = String(request.headers.get("x-dream-foto-key") || "").trim();
  return Boolean(expected && received && expected === received);
}

function json(payload, status = 200) {
  return Response.json(payload, {
    status,
    headers: {
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff"
    }
  });
}

export async function POST(request) {
  if (!isInternal(request)) {
    return json({ ok: false, error: "forbidden", message: "Forbidden" }, 403);
  }

  try {
    const form = await request.formData();
    const image = form.get("image");

    if (!image || typeof image === "string") {
      return json({ ok: false, error: "image_required" }, 400);
    }

    if (!image.type?.startsWith("image/")) {
      return json({ ok: false, error: "invalid_file_type" }, 415);
    }

    if (image.size > MAX_FILE_BYTES) {
      return json({ ok: false, error: "image_too_large" }, 413);
    }

    const input = Buffer.from(await image.arrayBuffer());
    const preview = await applyPreviewWatermark(input);

    return new Response(preview, {
      status: 200,
      headers: {
        "Content-Type": "image/jpeg",
        "Content-Disposition": 'inline; filename="preview.jpg"',
        "Cache-Control": "no-store",
        "X-Content-Type-Options": "nosniff"
      }
    });

  } catch (error) {
    console.error("watermark_error", {
      type: error?.name || null
    });

    return json(
      { ok: false, error: "watermark_failed", message: "Watermark failed." },
      500
    );
  }
}
