const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Cache-Control": "no-store"
};

const MAX_FILE_BYTES = 4_000_000;

export function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: corsHeaders
  });
}

export async function POST(request) {
  try {
    const formData = await request.formData();

    const image = formData.get("image");
    const effectsRaw = formData.get("effects") || "[]";
    const intensity = String(formData.get("intensity") || "1");

    if (!image || typeof image === "string") {
      return Response.json(
        { ok: false, error: "image_required" },
        { status: 400, headers: corsHeaders }
      );
    }

    if (!image.type || !image.type.startsWith("image/")) {
      return Response.json(
        { ok: false, error: "invalid_file_type", type: image.type || null },
        { status: 415, headers: corsHeaders }
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
        { status: 413, headers: corsHeaders }
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
        message: "Image received successfully. OpenAI is not connected yet.",
        time: new Date().toISOString()
      },
      {
        status: 200,
        headers: corsHeaders
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
        headers: corsHeaders
      }
    );
  }
}
