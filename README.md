# Retouch API

Минимальный backend для Vercel.

## После загрузки в GitHub

1. Откройте Vercel.
2. Add New → Project.
3. Import Git Repository.
4. Выберите этот репозиторий.
5. Framework Preset: Other.
6. Root Directory: ./
7. Build Command и Output Directory не задавайте вручную.
8. Нажмите Deploy.

После деплоя откройте:

`https://ВАШ-ПРОЕКТ.vercel.app/api/health`

Ожидаемый ответ:

```json
{
  "ok": true,
  "service": "retouch-api",
  "time": "..."
}
```

На этом этапе OpenAI API ещё не подключён.
