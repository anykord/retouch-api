import OpenAI, { toFile } from "openai";
import sharp from "sharp";
import { MAX_FILE_BYTES, SUPPORTED_EFFECTS } from "../lib/config.mjs";
import { buildPrompt } from "../lib/prompt.mjs";

export const maxDuration = 120;

function cleanSecret(raw) {
  return String(raw || "").split(/\r?\n/)[0].trim();
}

function isInternal(request) {
  const expected = cleanSecret(process.env.INTERNAL_API_KEY);
  const received = String(request.headers.get("x-dream-foto-key") || "").trim();
  return Boolean(expected && received && expected === received);
}

function parseEffects(raw) {
  try {
    const parsed = JSON.parse(String(raw || "[]"));
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((x) => SUPPORTED_EFFECTS.includes(String(x))).slice(0, 4);
  } catch {
    return [];
  }
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

function isSafetyError(error) {
  const message = String(error?.message || "").toLowerCase();
  const code = String(error?.code || "").toLowerCase();

  return (
    code.includes("moderation") ||
    message.includes("moderation_blocked") ||
    message.includes("safety_violations") ||
    message.includes("safety system")
  );
}

async function normalizeForTransfer(buffer) {
  const attempts = [
    { quality: 92, width: 2048 },
    { quality: 86, width: 2048 },
    { quality: 82, width: 1800 },
    { quality: 78, width: 1600 }
  ];

  for (const attempt of attempts) {
    const out = await sharp(buffer)
      .rotate()
      .resize({
        width: attempt.width,
        height: attempt.width,
        fit: "inside",
        withoutEnlargement: true
      })
      .jpeg({ quality: attempt.quality, mozjpeg: true })
      .toBuffer();

    if (out.length <= 3_600_000) return out;
  }

  throw new Error("Clean result is too large for transfer");
}

export async function POST(request) {
  if (!isInternal(request)) {
    return json({ ok: false, error: "forbidden", message: "Forbidden" }, 403);
  }

  try {
    const apiKey = cleanSecret(process.env.OPENAI_API_KEY);
    if (!apiKey) {
      return json({ ok: false, error: "openai_key_missing" }, 500);
    }

    const form = await request.formData();
    const image = form.get("image");
    const effects = parseEffects(form.get("effects"));
    const intensity = String(form.get("intensity") || "1");

    if (!image || typeof image === "string") {
      return json({ ok: false, error: "image_required" }, 400);
    }

    if (!image.type?.startsWith("image/")) {
      return json({ ok: false, error: "invalid_file_type" }, 415);
    }

    if (image.size > MAX_FILE_BYTES) {
      return json({ ok: false, error: "image_too_large" }, 413);
    }

    if (!effects.length) {
      return json({ ok: false, error: "no_effects_selected" }, 400);
    }

    const input = Buffer.from(await image.arrayBuffer());
    const upload = await toFile(input, "photo.jpg", {
      type: image.type || "image/jpeg"
    });

    const openai = new OpenAI({ apiKey });

    const result = await openai.images.edit({
      model: "gpt-image-2",
      image: upload,
      prompt: buildPrompt(effects, intensity),
      quality: "low"
    });

    const item = result.data?.[0];
    if (!item) throw new Error("OpenAI returned no image");

    let raw;

    if (item.b64_json) {
      raw = Buffer.from(item.b64_json, "base64");
    } else if (item.url) {
      const r = await fetch(item.url, { cache: "no-store" });
      if (!r.ok) throw new Error("Could not fetch result");
      raw = Buffer.from(await r.arrayBuffer());
    } else {
      throw new Error("No image payload");
    }

    const clean = await normalizeForTransfer(raw);

    return new Response(clean, {
      status: 200,
      headers: {
        "Content-Type": "image/jpeg",
        "Content-Disposition": 'inline; filename="clean.jpg"',
        "Cache-Control": "no-store",
        "X-Content-Type-Options": "nosniff"
      }
    });

  } catch (error) {
    const status = Number.isInteger(error?.status) ? error.status : 500;

    console.error("retouch_clean_error", {
      status,
      code: error?.code || null,
      type: error?.type || null
    });

    if (isSafetyError(error)) {
      return json(
        {
          ok: false,
          error: "image_safety_rejected",
          message: "The image was rejected by the image safety system."
        },
        422
      );
    }

    return json(
      { ok: false, error: "retouch_failed", message: "Image processing failed." },
      status >= 400 && status <= 599 ? status : 500
    );
  }
}
