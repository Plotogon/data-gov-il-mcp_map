# 🔧 Полная перезагрузка сервера - Пошаговая инструкция

## Шаг 1: Остановить все процессы Node.js

```powershell
# Убить ВСЕ процессы node
Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force

# Проверить что порт 3002 свободен
netstat -ano | findstr :3002
```

✅ Должно быть пусто

---

## Шаг 2: Перейти в govmap-explorer

```powershell
cd c:\Work\MCP\gov-IL\data-gov-il-mcp\packages\govmap-explorer
```

---

## Шаг 3: Запустить ЧИСТЫЙ сервер

```powershell
npm start
```

✅ Должны увидеть:
```
🌍 GovMap Explorer running on http://localhost:3002
📡 Connected to MCP servers: mcp-gov, mcp-geospatial, mcp-legal
```

---

## Шаг 4: Открыть браузер с ЧИСТЫМ кэшем

**Важно!** Используйте:
- **Chrome/Edge**: `Ctrl + Shift + R` (hard refresh)
- **Firefox**: `Ctrl + F5`

Или откройте в **режиме Инкогнито/InPrivate**:
```
http://localhost:3002
```

---

## Шаг 5: Проверить загрузку данных

### Откройте Developer Tools (F12)
1. Вкладка **Console**
2. Включите чекбокс **Schools** 🏫
3. Должны увидеть логи:
   ```
   🔄 Loading layer: schools
   Fetched 500 raw records for schools
   Returning XXX items after conversion/filtering
   ```

### Проверьте Network (вкладка)
1. Включите любой слой
2. Найдите запрос `/api/layers/schools`
3. Проверьте Response - должен быть JSON массив с данными

---

## Шаг 6: Проблемы? Диагностика

### Если школы не появляются:
```javascript
// В Console браузера выполните:
fetch('/api/layers/schools')
  .then(r => r.json())
  .then(data => console.log('Schools data:', data.length, 'records'))
```

✅ Должно показать количество школ

### Если синагоги не появляются:
```javascript
fetch('/api/layers/synagogues')
  .then(r => r.json())
  .then(data => console.log('Synagogues:', data.length))
```

✅ Должно быть 269

### Если Police tab висит:
1. Нажмите кнопку "Получить статистику"
2. **Через 5 секунд** должен появиться fallback контент
3. Если не появляется - браузер закэшировал старый `app.js`
   - Решение: **Ctrl+Shift+Delete** → Clear Cache → Hard Reload

---

## Шаг 7: Что должно работать

| Слой | Записей | Статус |
|------|---------|--------|
| 🏫 Schools | ~3,329 | ✅ Реальные данные |
| 🚒 Fire | 138 | ✅ Реальные данные |
| 🕍 Synagogues | 269 | ✅ Реальные (Beer Sheva) |
| 🅿️ Park&Ride | 185 | ✅ Реальные (Национальные) |
| 🏥 Hospitals | 10 | Demo |
| 👮 Police | 5 | Demo |
| 🚌 Bus | 4 | Demo |

---

## ⚠️ Если ничего не помогло

**Соберите диагностику:**

1. **Console логи** (F12 → Console)
2. **Network errors** (F12 → Network → filter: Errors)
3. **Server logs** (терминал где запущен npm start)

И покажите мне - разберемся!
