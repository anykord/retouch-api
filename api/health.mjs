export function GET() {
  return Response.json({
    ok: true,
    service: "retouch-api",
    openaiConfigured: Boolean(process.env.OPENAI_API_KEY),
    time: new Date().toISOString()
  });
}
