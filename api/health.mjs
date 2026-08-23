import { corsHeaders, isOriginAllowed, forbiddenOriginResponse } from "../lib/cors.mjs";
import { getAllowedOrigins, getWatermarkText } from "../lib/config.mjs";

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

export function GET(request) {
  const origin = request.headers.get("origin") || "";
  if (!isOriginAllowed(origin)) {
    return forbiddenOriginResponse(origin);
  }

  return Response.json(
    {
      ok: true,
      service: "retouch-api",
      openaiConfigured: Boolean(process.env.OPENAI_API_KEY),
      allowedOrigins: getAllowedOrigins(),
      watermarkText: getWatermarkText(),
      time: new Date().toISOString()
    },
    {
      headers: corsHeaders(origin)
    }
  );
}
