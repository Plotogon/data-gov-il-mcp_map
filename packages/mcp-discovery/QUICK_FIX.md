# Решение "Could not attach MCP server"

## Быстрое решение

### Вариант 1: Использовать batch файл (РЕКОМЕНДУЕТСЯ)

**Шаг 1:** Создан файл `start.bat` в папке mcp-discovery

**Шаг 2:** Используйте эту конфигурацию в Claude:

```json
{
  "mcpServers": {
    "mcp-discovery": {
      "command": "c:\\Work\\MCP\\gov-IL\\data-gov-il-mcp\\packages\\mcp-discovery\\start.bat"
    }
  }
}
```

**Шаг 3:** Перезапустите Claude Desktop

---

### Вариант 2: Использовать npx (если установлен npm)

```json
{
  "mcpServers": {
    "mcp-discovery": {
      "command": "npx",
      "args": ["-y", "node", "src/server.js"],
      "cwd": "c:/Work/MCP/gov-IL/data-gov-il-mcp/packages/mcp-discovery"
    }
  }
}
```

---

### Вариант 3: Прямой путь (если варианты выше не работают)

```json
{
  "mcpServers": {
    "mcp-discovery": {
      "command": "C:\\Program Files\\nodejs\\node.exe",
      "args": ["c:\\Work\\MCP\\gov-IL\\data-gov-il-mcp\\packages\\mcp-discovery\\src\\server.js"]
    }
  }
}
```

Обратите внимание: **двойные обратные слэши** везде!

---

## Проверка перед запуском

### 1. Проверьте, что batch файл работает:

```cmd
cd c:\Work\MCP\gov-IL\data-gov-il-mcp\packages\mcp-discovery
start.bat
```

Должно появиться:
```
🔍 MCP-Discovery Server starting...
  ✅ analyze_website registered
  ...
```

### 2. Проверьте путь к конфигурации Claude:

```cmd
notepad %APPDATA%\Claude\claude_desktop_config.json
```

### 3. Проверьте JSON синтаксис:

- Все кавычки парные
- Запятые между элементами (но не после последнего)
- Правильные слэши

---

## Типичные ошибки

### ❌ Неправильно:
```json
{
  "mcpServers": {
    "mcp-discovery": {
      "command": "node",  // node может быть не в PATH
      "cwd": "c:\Work\..." // одинарные слэши
    }
  }
}
```

### ✅ Правильно:
```json
{
  "mcpServers": {
    "mcp-discovery": {
      "command": "c:\\Work\\MCP\\gov-IL\\data-gov-il-mcp\\packages\\mcp-discovery\\start.bat"
    }
  }
}
```

---

## Полная рабочая конфигурация

Скопируйте это целиком в `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "mcp-discovery": {
      "command": "c:\\Work\\MCP\\gov-IL\\data-gov-il-mcp\\packages\\mcp-discovery\\start.bat"
    }
  }
}
```

**Если у вас уже есть другие серверы:**

```json
{
  "mcpServers": {
    "existing-server": {
      "command": "...",
      "args": ["..."]
    },
    "mcp-discovery": {
      "command": "c:\\Work\\MCP\\gov-IL\\data-gov-il-mcp\\packages\\mcp-discovery\\start.bat"
    }
  }
}
```

---

## После изменения конфигурации

1. **Сохраните** файл
2. **Полностью закройте** Claude Desktop:
   - Закройте окно
   - Проверьте системный трей (правый нижний угол)
   - Убедитесь, что процесс завершен
3. **Запустите** Claude Desktop заново
4. **Подождите** 5-10 секунд для инициализации

---

## Проверка подключения

В Claude Desktop напишите:

```
Покажи доступные инструменты
```

Или:

```
Какие MCP серверы подключены?
```

Должны увидеть:
- ✅ mcp-discovery
- ✅ analyze_website
- ✅ parse_api_spec
- ✅ generate_mcp_schema

---

## Если все еще не работает

### Проверьте логи Claude Desktop:

```cmd
explorer %APPDATA%\Claude\logs
```

Откройте последний файл и найдите ошибки про mcp-discovery.

### Попробуйте минимальную конфигурацию:

Создайте НОВЫЙ файл `test-config.json`:

```json
{
  "mcpServers": {
    "test": {
      "command": "c:\\Work\\MCP\\gov-IL\\data-gov-il-mcp\\packages\\mcp-discovery\\start.bat"
    }
  }
}
```

Скопируйте его в `%APPDATA%\Claude\claude_desktop_config.json`

---

## Альтернатива: Тестирование без Claude Desktop

Если Claude Desktop не работает, можно использовать другой MCP клиент или тестировать через stdio напрямую.

Сервер точно работает - мы это проверили! Проблема только в конфигурации Claude.

---

**Рекомендация:** Используйте Вариант 1 с batch файлом - это самый надежный способ! 🚀
