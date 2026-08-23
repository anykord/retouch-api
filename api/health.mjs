export function GET() {
  return Response.json({
    ok: true,
    service: "retouch-api",
    time: new Date().toISOString()
  });
}
