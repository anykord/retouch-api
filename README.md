# Dream Foto Vercel worker — payment-ready

Browser never calls Vercel.

Used endpoints:
- POST /api/retouch-clean — REG.RU sends source image; returns clean edited JPEG.
- POST /api/watermark — REG.RU sends saved clean JPEG; returns watermarked preview.
- GET /api/health

Both POST endpoints require `X-Dream-Foto-Key` matching Vercel env `INTERNAL_API_KEY`.

Existing env:
- OPENAI_API_KEY
- INTERNAL_API_KEY

The clean result is returned server-to-server and must be stored privately on REG.RU.
