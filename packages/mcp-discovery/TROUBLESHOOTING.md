# Исправление ошибки "server disconnected"

## Проблема
Claude Desktop показывает: "mcp-discovery server disconnected"

## Причины и решения

### Решение 1: Использовать полный путь к node.exe

Вместо:
```json
{
  "mcpServers": {
    "mcp-discovery": {
      "command": "node",
      ...
    }
  }
}
```

Используйте полный путь:
```json
{
  "mcpServers": {
    "mcp-discovery": {
      "command": "C:\\Program Files\\nodejs\\node.exe",
      "args": ["src/server.js"],
      "cwd": "c:/Work/MCP/gov-IL/data-gov-il-mcp/packages/mcp-discovery"
    }
  }
}
```

**Как найти путь к node:**
```bash
where node
```

### Решение 2: Проверить путь cwd

Убедитесь, что путь существует и правильный:
```json
"cwd": "c:/Work/MCP/gov-IL/data-gov-il-mcp/packages/mcp-discovery"
```

**НЕ используйте:**
- `C:\Work\...` (обратные слэши нужно экранировать)
- Относительные пути

**Используйте:**
- `c:/Work/...` (прямые слэши)
- Или `C:\\Work\\...` (двойные обратные слэши)

### Решение 3: Проверить зависимости

```bash
cd c:\Work\MCP\gov-IL\data-gov-il-mcp\packages\mcp-discovery
npm install
```

### Решение 4: Тестовая конфигурация

Попробуйте эту рабочую конфигурацию:

```json
{
  "mcpServers": {
    "mcp-discovery": {
      "command": "C:\\Program Files\\nodejs\\node.exe",
      "args": [
        "c:/Work/MCP/gov-IL/data-gov-il-mcp/packages/mcp-discovery/src/server.js"
      ]
    }
  }
}
```

Здесь мы:
- Используем полный путь к node.exe
- Указываем полный путь к server.js в args
- Убрали cwd (не обязательно, если путь полный)

### Решение 5: Проверить логи Claude

**Windows:**
```
%APPDATA%\Claude\logs
```

Откройте последний лог-файл и найдите ошибки, связанные с mcp-discovery.

### Решение 6: Упрощенная конфигурация с npm

Если ничего не помогает, создайте wrapper скрипт:

**Создайте файл `start.bat`:**
```batch
@echo off
cd /d c:\Work\MCP\gov-IL\data-gov-il-mcp\packages\mcp-discovery
node src/server.js
```

**Конфигурация Claude:**
```json
{
  "mcpServers": {
    "mcp-discovery": {
      "command": "c:/Work/MCP/gov-IL/data-gov-il-mcp/packages/mcp-discovery/start.bat"
    }
  }
}
```

## Проверка работоспособности

### Тест 1: Запуск вручную
```bash
cd c:\Work\MCP\gov-IL\data-gov-il-mcp\packages\mcp-discovery
node src/server.js
```

Должно появиться:
```
🔍 MCP-Discovery Server starting...
  ✅ analyze_website registered
  ✅ parse_api_spec registered
  ✅ generate_mcp_schema registered
🎯 Discovery server ready!
🚀 MCP-Discovery server running on stdio
```

### Тест 2: Проверка node
```bash
node --version
```

Должно показать версию (например, v18.0.0 или выше).

### Тест 3: Проверка пути
```bash
cd c:\Work\MCP\gov-IL\data-gov-il-mcp\packages\mcp-discovery
dir src\server.js
```

Файл должен существовать.

## Рекомендуемая конфигурация

После выполнения `where node`, используйте эту конфигурацию:

```json
{
  "mcpServers": {
    "mcp-discovery": {
      "command": "ПУТЬ_К_NODE_ИЗ_WHERE_NODE",
      "args": ["src/server.js"],
      "cwd": "c:/Work/MCP/gov-IL/data-gov-il-mcp/packages/mcp-discovery",
      "env": {
        "NODE_ENV": "production"
      }
    }
  }
}
```

Замените `ПУТЬ_К_NODE_ИЗ_WHERE_NODE` на результат команды `where node`.

## Если все еще не работает

1. Перезагрузите компьютер (обновит PATH)
2. Переустановите Node.js
3. Проверьте антивирус (может блокировать)
4. Попробуйте запустить Claude Desktop от имени администратора

---

**После исправления:** Перезапустите Claude Desktop и проверьте снова!
