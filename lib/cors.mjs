import { getAllowedOrigins, allowNullOrigin } from "./config.mjs";

export function isOriginAllowed(origin) {
  if (!origin) return true;

  if (origin === "null") {
    return allowNullOrigin();
  }

  return getAllowedOrigins().includes(origin);
}

export function corsHeaders(origin, methods = "GET, POST, OPTIONS") {
  const headers = {
    "Access-Control-Allow-Methods": methods,
    "Access-Control-Allow-Headers": "Content-Type",
    "Vary": "Origin",
    "Cache-Control": "no-store"
  };

  if (!origin) {
    headers["Access-Control-Allow-Origin"] = "*";
    return headers;
  }

  if (isOriginAllowed(origin)) {
    headers["Access-Control-Allow-Origin"] = origin;
  }

  return headers;
}

export function forbiddenOriginResponse(origin) {
  return Response.json(
    {
      ok: false,
      error: "origin_not_allowed",
      origin,
      allowedOrigins: getAllowedOrigins()
    },
    {
      status: 403,
      headers: corsHeaders(origin)
    }
  );
}
