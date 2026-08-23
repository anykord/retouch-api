# Dream Foto Vercel worker

Browser does NOT call this project directly.

Flow:
dream-foto.ru -> REG.RU PHP -> Vercel -> OpenAI -> Vercel -> REG.RU -> browser

Required Vercel Environment Variables:
- OPENAI_API_KEY
- INTERNAL_API_KEY

Copy INTERNAL_API_KEY from:
regru/private/dream-foto-config.php

Endpoints:
- GET /api/health
- POST /api/retouch (private, requires X-Dream-Foto-Key)
