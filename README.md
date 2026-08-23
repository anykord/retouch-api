# Retouch API — full backend v1

Полный backend для Dream Foto:

- `GET /api/health`
- `POST /api/retouch-test`
- `POST /api/retouch`
- GPT Image 2 через OpenAI SDK
- серверный baked watermark через `sharp`
- CORS уже ограничен доменом `https://dream-foto.ru` и `https://www.dream-foto.ru`

## Структура

```text
retouch-api/
├── api/
│   ├── health.mjs
│   ├── retouch-test.mjs
│   └── retouch.mjs
├── lib/
│   ├── config.mjs
│   ├── cors.mjs
│   ├── prompt.mjs
│   └── watermark.mjs
├── frontend-fetch-snippet.js
├── local-preview-test.html
├── package.json
├── vercel.json
└── README.md
```

## Что делает `/api/retouch`

1. Принимает `multipart/form-data`
2. Ожидает:
   - `image`
   - `effects` (JSON-массив)
   - `intensity` (`1`, `2`, `3`)
3. Отправляет фото в GPT Image 2
4. Получает чистый результат
5. Накладывает watermark на сервере
6. Возвращает в браузер только watermarked preview как `image/jpeg`

## Деплой

1. Замените содержимое GitHub-репозитория `retouch-api` файлами из этого архива.
2. Сделайте commit.
3. Vercel сам сделает redeploy.

## Environment Variables на Vercel

### Обязательная
- `OPENAI_API_KEY`

### Необязательные
- `ALLOWED_ORIGINS`
  - если хотите переопределить список доменов:
  - пример:
    `https://dream-foto.ru,https://www.dream-foto.ru`
- `WATERMARK_TEXT`
  - пример:
    `PREVIEW • DREAM-FOTO.RU`
- `ALLOW_NULL_ORIGIN`
  - `true` только если хотите временно тестировать из локального HTML-файла
  - для production не нужно

## Проверка после деплоя

### 1. Health
Откройте:

`https://retouch-api.vercel.app/api/health`

Ожидаемо:

```json
{
  "ok": true,
  "service": "retouch-api",
  "openaiConfigured": true
}
```

### 2. Preview generation
Если хотите локально протестировать backend, есть файл:

`local-preview-test.html`

Важно:
- он открывается как локальный файл, а это origin `null`;
- поэтому для такого теста добавьте env:
  - `ALLOW_NULL_ORIGIN=true`
- затем redeploy.

Для реального лендинга на `dream-foto.ru` это не нужно.

## Production CORS

По умолчанию backend уже допускает только:

- `https://dream-foto.ru`
- `https://www.dream-foto.ru`

То есть после интеграции на домен отдельная настройка CORS уже не понадобится.

## Ограничения

- программный лимит файла: `4 MB`
- поддерживаются только image/*

Рекомендуется на фронтенде перед отправкой:
- уменьшать длинную сторону до `1600–2048 px`
- сохранять JPEG quality `0.80–0.88`

## Интеграция с фронтендом

Файл `frontend-fetch-snippet.js` содержит готовый пример `fetch()` для лендинга.

Типовой сценарий:
1. пользователь загружает фото;
2. фронтенд отправляет файл + effects + intensity на `/api/retouch`;
3. получает `Blob`;
4. показывает его в вашем сравнении `До / После`.

## Что ещё не сделано

В этой версии backend:
- нет оплаты;
- нет выдачи чистого файла после оплаты;
- нет хранения clean image;
- нет одноразовых токенов скачивания.

То есть это production-ready backend именно для **preview-этапа MVP**.

Следующий backend-шаг после интеграции на сайт:
1. подключение оплаты;
2. временное хранение clean image;
3. отдельный endpoint для выдачи clean image после оплаты.
