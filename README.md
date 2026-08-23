# Retouch API — шаг 3: GPT Image 2

Этот архив добавляет реальный endpoint:

`POST /api/retouch`

Он принимает:
- `image`
- `effects`
- `intensity`

и вызывает GPT Image 2 через официальный OpenAI SDK.

## 1. Сначала добавьте API key в Vercel

Project → Settings → Environment Variables

Name:
`OPENAI_API_KEY`

Value:
ваш OpenAI API key.

Добавьте для Production (можно также Preview).

После добавления переменной сделайте новый deployment.

Проверка:

`https://retouch-api.vercel.app/api/health`

Теперь JSON должен содержать:

`"openaiConfigured": true`

## 2. Обновите GitHub

Замените содержимое репозитория файлами этого архива и сделайте commit.

Vercel автоматически установит dependency `openai` и redeploy проекта.

## 3. Проверьте реальную генерацию

Откройте `local-openai-test.html`.

API URL уже указан:
`https://retouch-api.vercel.app/api/retouch`

Выберите:
- фотографию до 4 MB;
- один или несколько эффектов;
- интенсивность.

Нажмите «Обработать».

Если всё работает, справа появится настоящее изображение от GPT Image 2.

## Важно

На этом шаге watermark специально ещё не добавлен.

Цель — сначала изолированно проверить:
1. Vercel → OpenAI;
2. качество редактирования;
3. latency;
4. наши prompts.

После этого добавим server-side watermark, и только watermarked image будет уходить в браузер до оплаты.

## CORS

Пока всё ещё `Access-Control-Allow-Origin: *`, чтобы тестировать из локального HTML.

Когда основной лендинг будет размещён на REG.RU, заменим `*` на его конкретный origin.
