# Retouch API — шаг 2

На этом шаге OpenAI ещё НЕ подключён.

Добавлен endpoint:

`POST /api/retouch-test`

Он принимает multipart/form-data:

- `image` — изображение
- `effects` — JSON-массив, например `["wrinkles","eye_bags"]`
- `intensity` — `"1"`, `"2"` или `"3"`

И возвращает JSON с информацией о полученном файле.

## Как обновить GitHub

Можно просто заменить содержимое текущего репозитория файлами из этого архива и сделать commit.

После автоматического redeploy Vercel проверьте:

`https://ВАШ-ПРОЕКТ.vercel.app/api/health`

Затем:

`https://ВАШ-ПРОЕКТ.vercel.app/api/retouch-test`

GET для retouch-test не предусмотрен — это нормально. Тестировать нужно POST-запросом.

## Самый простой тест

В архиве есть `local-upload-test.html`.

1. Откройте его на компьютере.
2. В поле API URL вставьте:
   `https://retouch-api.vercel.app/api/retouch-test`
3. Выберите фото до ~4 MB.
4. Нажмите «Отправить».

Успешный ответ будет примерно:

```json
{
  "status": 200,
  "ok": true,
  "received": {
    "name": "photo.jpg",
    "type": "image/jpeg",
    "bytes": 1234567,
    "effects": ["wrinkles", "eye_bags"],
    "intensity": "1"
  }
}
```

## CORS

Для этого тестового шага установлен:

`Access-Control-Allow-Origin: *`

Это сделано намеренно, чтобы endpoint можно было проверить даже из локального HTML.

Перед production мы заменим `*` на конкретный домен лендинга на REG.RU.

## Размер файла

В endpoint добавлен программный лимит 4 MB, чтобы не упираться в лимиты serverless-запроса.
На следующем этапе мы также добавим client-side уменьшение фотографий перед отправкой.
