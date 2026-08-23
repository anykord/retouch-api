import { corsHeaders, isOriginAllowed, forbiddenOriginResponse } from "../lib/cors.mjs";
import { MAX_FILE_BYTES } from "../lib/config.mjs";

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
    const formData = await request.formData();
    const image = formData.get("image");
    const effectsRaw = formData.get("effects") || "[]";
    const intensity = String(formData.get("intensity") || "1");

    if (!image || typeof image === "string") {
      return Response.json(
        { ok: false, error: "image_required" },
        { status: 400, headers: corsHeaders(origin) }
      );
    }

    if (!image.type?.startsWith("image/")) {
      return Response.json(
        { ok: false, error: "invalid_file_type", type: image.type || null },
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

    let effects = [];
    try {
      effects = JSON.parse(String(effectsRaw));
      if (!Array.isArray(effects)) effects = [];
    } catch {
      effects = [];
    }

    return Response.json(
      {
        ok: true,
        received: {
          name: image.name || "image",
          type: image.type,
          bytes: image.size,
          effects,
          intensity
        },
        message: "Image received successfully."
      },
      {
        headers: corsHeaders(origin)
      }
    );
  } catch (error) {
    return Response.json(
      {
        ok: false,
        error: "server_error",
        message: error instanceof Error ? error.message : "Unknown error"
      },
      {
        status: 500,
        headers: corsHeaders(origin)
      }
    );
  }
}
