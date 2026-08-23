import OpenAI, { toFile } from "openai";
import { MAX_FILE_BYTES, SUPPORTED_EFFECTS } from "../lib/config.mjs";
import { buildPrompt } from "../lib/prompt.mjs";
import { applyPreviewWatermark } from "../lib/watermark.mjs";

export const maxDuration = 120;

function sanitizeSecret(raw) {
  return String(raw || "")
    .split(/\r?\n/)[0]
    .trim();
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

function isInternalRequest(request) {
  const expected = sanitizeSecret(process.env.INTERNAL_API_KEY);
  const received = String(request.headers.get("x-dream-foto-key") || "").trim();
  return Boolean(expected && received && expected === received);
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

export async function POST(request) {
  if (!isInternalRequest(request)) {
    return json(
      { ok: false, error: "forbidden", message: "Forbidden" },
      403
    );
  }

  try {
    const apiKey = sanitizeSecret(process.env.OPENAI_API_KEY);

    if (!apiKey) {
      return json(
        { ok: false, error: "openai_key_missing", message: "OpenAI key is not configured." },
        500
      );
    }

    const formData = await request.formData();
    const image = formData.get("image");
    const effects = parseEffects(formData.get("effects"));
    const intensity = String(formData.get("intensity") || "1");

    if (!image || typeof image === "string") {
      return json({ ok: false, error: "image_required", message: "Image is required." }, 400);
    }

    if (!image.type?.startsWith("image/")) {
      return json({ ok: false, error: "invalid_file_type", message: "Invalid file type." }, 415);
    }

    if (image.size > MAX_FILE_BYTES) {
      return json(
        {
          ok: false,
          error: "image_too_large",
          message: "Image is too large.",
          maxBytes: MAX_FILE_BYTES,
          receivedBytes: image.size
        },
        413
      );
    }

    if (!effects.length) {
      return json(
        { ok: false, error: "no_effects_selected", message: "No supported effects selected." },
        400
      );
    }

    const prompt = buildPrompt(effects, intensity);
    const openai = new OpenAI({ apiKey });

    const inputBuffer = Buffer.from(await image.arrayBuffer());
    const upload = await toFile(
      inputBuffer,
      "photo.jpg",
      { type: image.type || "image/jpeg" }
    );

    const started = Date.now();

    const result = await openai.images.edit({
      model: "gpt-image-2",
      image: upload,
      prompt,
      quality: "low"
    });

    const item = result.data?.[0];
    if (!item) throw new Error("OpenAI returned no image");

    let cleanBuffer;

    if (item.b64_json) {
      cleanBuffer = Buffer.from(item.b64_json, "base64");
    } else if (item.url) {
      const imgResponse = await fetch(item.url, { cache: "no-store" });
      if (!imgResponse.ok) throw new Error("Could not download generated image");
      cleanBuffer = Buffer.from(await imgResponse.arrayBuffer());
    } else {
      throw new Error("OpenAI response contains neither b64_json nor url");
    }

    const previewBuffer = await applyPreviewWatermark(cleanBuffer);
    cleanBuffer = null;

    return new Response(previewBuffer, {
      status: 200,
      headers: {
        "Content-Type": "image/jpeg",
        "Content-Disposition": 'inline; filename="preview.jpg"',
        "Cache-Control": "no-store",
        "X-Content-Type-Options": "nosniff",
        "X-Retouch-Generation-Ms": String(Date.now() - started)
      }
    });

  } catch (error) {
    const status = Number.isInteger(error?.status) ? error.status : 500;

    console.error("retouch_error", {
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
      {
        ok: false,
        error: "retouch_failed",
        message: "Image processing failed."
      },
      status >= 400 && status <= 599 ? status : 500
    );
  }
}
