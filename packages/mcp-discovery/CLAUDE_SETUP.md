# Подключение MCP-Discovery к Claude Desktop

## Шаг 1: Найти конфигурационный файл Claude

**Windows:**
```
%APPDATA%\Claude\claude_desktop_config.json
```

Полный путь обычно:
```
C:\Users\<ВашеИмя>\AppData\Roaming\Claude\claude_desktop_config.json
```

**Как открыть:**
1. Нажмите `Win + R`
2. Введите: `%APPDATA%\Claude`
3. Найдите файл `claude_desktop_config.json`

---

## Шаг 2: Отредактировать конфигурацию

Откройте `claude_desktop_config.json` в текстовом редакторе и добавьте:

```json
{
  "mcpServers": {
    "mcp-discovery": {
      "command": "node",
      "args": [
        "src/server.js"
      ],
      "cwd": "c:/Work/MCP/gov-IL/data-gov-il-mcp/packages/mcp-discovery"
    }
  }
}
```

**Если уже есть другие серверы:**
```json
{
  "mcpServers": {
    "existing-server": {
      "command": "...",
      "args": ["..."]
    },
    "mcp-discovery": {
      "command": "node",
      "args": [
        "src/server.js"
      ],
      "cwd": "c:/Work/MCP/gov-IL/data-gov-il-mcp/packages/mcp-discovery"
    }
  }
}
```

---

## Шаг 3: Перезапустить Claude Desktop

1. **Полностью закройте** Claude Desktop (проверьте в трее)
2. **Запустите** Claude Desktop заново
3. Подождите несколько секунд для инициализации

---

## Шаг 4: Проверить подключение

В Claude Desktop напишите:

```
Какие MCP серверы доступны?
```

Или:

```
Покажи доступные инструменты
```

Вы должны увидеть:
- ✅ `analyze_website`
- ✅ `parse_api_spec`
- ✅ `generate_mcp_schema`

---

## Шаг 5: Первый тест

Попробуйте команду:

```
Используй analyze_website для анализа https://data.gov.il с глубиной 1 и фокусом на api
```

Или более естественно:

```
Проанализируй сайт data.gov.il и найди там API
```

**Ожидаемый результат:**
- Список найденных API endpoints
- Формы для поиска данных
- Ссылки на документацию
- Данные о CKAN API

---

## Тестовые команды

### Тест 1: Анализ data.gov.il
```
Проанализируй https://data.gov.il и найди все API endpoints
```

### Тест 2: Анализ системы предупреждений
```
Найди API на сайте https://www.oref.org.il для получения предупреждений
```

### Тест 3: Анализ судебной системы
```
Проанализируй https://court.gov.il и найди формы для поиска дел
```

---

## Troubleshooting

### Проблема: Сервер не появляется в списке

**Решение:**
1. Проверьте путь в `cwd` - он должен быть абсолютным
2. Убедитесь, что Node.js установлен: `node --version`
3. Проверьте JSON синтаксис (запятые, кавычки)
4. Посмотрите логи Claude Desktop

### Проблема: Ошибка при запуске

**Решение:**
1. Проверьте, что зависимости установлены:
   ```bash
   cd c:\Work\MCP\gov-IL\data-gov-il-mcp\packages\mcp-discovery
   npm install
   ```
2. Проверьте, что сервер запускается вручную:
   ```bash
   node src/server.js
   ```

### Проблема: Инструменты не работают

**Решение:**
1. Проверьте интернет-соединение (для анализа сайтов)
2. Попробуйте с другим сайтом
3. Проверьте логи в консоли сервера

---

## Альтернативный метод: Тестирование через stdio

Если Claude Desktop не работает, можно тестировать напрямую:

```bash
cd c:\Work\MCP\gov-IL\data-gov-il-mcp\packages\mcp-discovery
node src/server.js
```

Затем используйте MCP клиент или отправляйте JSON через stdin.

---

## Полезные команды

### Проверить конфигурацию
```bash
type %APPDATA%\Claude\claude_desktop_config.json
```

### Посмотреть логи Claude (если доступны)
```bash
# Логи обычно в:
%APPDATA%\Claude\logs
```

### Перезапустить сервер вручную
```bash
cd c:\Work\MCP\gov-IL\data-gov-il-mcp\packages\mcp-discovery
npm start
```

---

## Готово! 🎉

После выполнения всех шагов вы сможете:
- Анализировать правительственные сайты
- Находить API endpoints
- Парсить API спецификации
- Генерировать MCP схемы

**Следующий шаг:** Используйте Discovery для исследования data.gov.il, oref.org.il, и court.gov.il!
