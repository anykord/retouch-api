import OpenAI, { toFile } from "openai";
import { corsHeaders, isOriginAllowed, forbiddenOriginResponse } from "../lib/cors.mjs";
import { MAX_FILE_BYTES, SUPPORTED_EFFECTS } from "../lib/config.mjs";
import { buildPrompt } from "../lib/prompt.mjs";
import { applyPreviewWatermark } from "../lib/watermark.mjs";

export const maxDuration = 120;

function sanitizeApiKey(raw) {
  return String(raw || "")
    .split(/\r?\n/)[0]
    .trim();
}

function parseEffects(raw) {
  try {
    const parsed = JSON.parse(String(raw || "[]"));
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((x) => SUPPORTED_EFFECTS.includes(String(x)));
  } catch {
    return [];
  }
}

export function OPTIONS(request) {
  const origin = request.headers.get("origin") || "";
  if (!isOriginAllowed(origin)) {
    return forbiddenOriginResponse(origin);
  }

  return new Response(null, {
    status: 204,
    headers: corsHeaders(origin)
  });
}

export async function POST(request) {
  const origin = request.headers.get("origin") || "";
  if (!isOriginAllowed(origin)) {
    return forbiddenOriginResponse(origin);
  }

  try {
    const apiKey = sanitizeApiKey(process.env.OPENAI_API_KEY);

    if (!apiKey) {
      return Response.json(
        { ok: false, error: "openai_key_missing" },
        { status: 500, headers: corsHeaders(origin) }
      );
    }

    const formData = await request.formData();
    const image = formData.get("image");
    const effects = parseEffects(formData.get("effects"));
    const intensity = String(formData.get("intensity") || "1");

    if (!image || typeof image === "string") {
      return Response.json(
        { ok: false, error: "image_required" },
        { status: 400, headers: corsHeaders(origin) }
      );
    }

    if (!image.type?.startsWith("image/")) {
      return Response.json(
        { ok: false, error: "invalid_file_type" },
        { status: 415, headers: corsHeaders(origin) }
      );
    }

    if (image.size > MAX_FILE_BYTES) {
      return Response.json(
        {
          ok: false,
          error: "image_too_large",
          maxBytes: MAX_FILE_BYTES,
          receivedBytes: image.size
        },
        { status: 413, headers: corsHeaders(origin) }
      );
    }

    if (!effects.length) {
      return Response.json(
        { ok: false, error: "no_effects_selected" },
        { status: 400, headers: corsHeaders(origin) }
      );
    }

    const prompt = buildPrompt(effects, intensity);

    const openai = new OpenAI({ apiKey });

    const inputBuffer = Buffer.from(await image.arrayBuffer());
    const upload = await toFile(
      inputBuffer,
      image.name || "photo.jpg",
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

    if (!item) {
      throw new Error("OpenAI returned no image");
    }

    let cleanBuffer;

    if (item.b64_json) {
      cleanBuffer = Buffer.from(item.b64_json, "base64");
    } else if (item.url) {
      const imgResponse = await fetch(item.url);
      if (!imgResponse.ok) throw new Error("Could not download generated image");
      cleanBuffer = Buffer.from(await imgResponse.arrayBuffer());
    } else {
      throw new Error("OpenAI response contains neither b64_json nor url");
    }

    const previewBuffer = await applyPreviewWatermark(cleanBuffer);

    return new Response(previewBuffer, {
      status: 200,
      headers: {
        ...corsHeaders(origin),
        "Content-Type": "image/jpeg",
        "Content-Disposition": 'inline; filename="preview.jpg"',
        "X-Retouch-Generation-Ms": String(Date.now() - started)
      }
    });
  } catch (error) {
    console.error("retouch_error", error);

    const status =
      error?.status && Number.isInteger(error.status)
        ? error.status
        : 500;

    return Response.json(
      {
        ok: false,
        error: "retouch_failed",
        message: error instanceof Error ? error.message : "Unknown error"
      },
      {
        status,
        headers: corsHeaders(origin)
      }
    );
  }
}
