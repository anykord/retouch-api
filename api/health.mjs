export function GET() {
  return Response.json(
    {
      ok: true,
      service: "retouch-api",
      openaiConfigured: Boolean(process.env.OPENAI_API_KEY),
      internalApiConfigured: Boolean(process.env.INTERNAL_API_KEY),
      mode: "server-to-server",
      endpoints: ["retouch-clean", "watermark"],
      time: new Date().toISOString()
    },
    {
      headers: {
        "Cache-Control": "no-store"
      }
    }
  );
}
