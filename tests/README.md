# Тестирование T2G (Torrent to Google Drive)

Данная директория содержит комплексные тесты для веб-приложения T2G, которые проверяют работоспособность всего функционала.

## Структура тестов

### 📁 Файлы тестов

- **`setup.js`** - Начальная настройка и мокирование зависимостей
- **`server.test.js`** - Тесты серверной части (API, маршруты, валидация)
- **`frontend.test.js`** - Тесты фронтенд функций (UI, форматирование, DOM)
- **`integration.test.js`** - Интеграционные тесты (полный рабочий процесс)

### 🧪 Покрытие тестами

| Компонент | Описание | Количество тестов |
|-----------|----------|-------------------|
| **Сервер** | Express маршруты, аутентификация, API | 15 тестов |
| **Frontend** | UI функции, валидация форм, DOM манипуляция | 15 тестов |
| **Интеграция** | Полные пользовательские сценарии | 9 тестов |

**Общее количество: 39 тестов ✅**

## Типы тестов

### 1. 🔧 Функциональные тесты

**Серверные функции:**
- ✅ Создание Express приложения
- ✅ Настройка базовых маршрутов
- ✅ Аутентификация пользователей
- ✅ API валидация данных
- ✅ Обработка загрузки файлов
- ✅ Обработка ошибок (404, валидация)
- ✅ Форматирование данных торрентов

**Frontend функции:**
- ✅ Форматирование байтов (B, KB, MB, GB)
- ✅ Форматирование времени (секунды, минуты, часы, дни)
- ✅ Экранирование HTML для безопасности
- ✅ Показ/скрытие уведомлений
- ✅ Переключение вкладок
- ✅ Отображение списка торрентов
- ✅ Валидация форм (magnet links, торрент файлы)

### 2. 🔗 Интеграционные тесты

**Полные пользовательские сценарии:**
- ✅ Загрузка страницы → аутентификация → добавление торрента
- ✅ Workflow с аутентифицированным пользователем
- ✅ Загрузка torrent файлов через multer
- ✅ Интеграция с Google Drive API
- ✅ Обработка сетевых ошибок
- ✅ Валидация входных данных
- ✅ Тестирование производительности API
- ✅ Создание директорий и файловые операции

### 3. 🛡️ Тесты безопасности

- ✅ Проверка аутентификации для защищенных маршрутов
- ✅ Валидация magnet ссылок на корректность
- ✅ Экранирование пользовательского ввода
- ✅ Безопасная загрузка файлов

## Команды для запуска

```bash
# Запуск всех тестов
npm test

# Запуск тестов в watch режиме
npm run test:watch

# Запуск тестов с анализом покрытия
npm run test:coverage
```

## Мокирование зависимостей

Для изоляции тестов используются моки следующих компонентов:

- **Google APIs** - мокирование OAuth и Drive API
- **WebTorrent** - симуляция торрент клиента
- **Passport.js** - мокирование аутентификации
- **Express Session** - упрощенные сессии для тестов

## Проверяемый функционал

### ✅ Основные возможности
- [x] Google OAuth аутентификация
- [x] Загрузка и валидация magnet ссылок
- [x] Загрузка .torrent файлов
- [x] Интеграция с Google Drive API
- [x] Real-time обновление статуса торрентов
- [x] Форматирование и отображение данных
- [x] Обработка ошибок и валидация входных данных

### ✅ UI/UX функции
- [x] Переключение между вкладками (magnet/файл)
- [x] Показ уведомлений (успех/ошибка)
- [x] Отображение прогресса загрузки
- [x] Форматирование размеров файлов
- [x] Форматирование времени загрузки
- [x] Responsive дизайн элементов

### ✅ Безопасность
- [x] Защита от XSS атак (экранирование HTML)
- [x] Валидация файлов (.torrent расширение)
- [x] Проверка magnet ссылок
- [x] Аутентификация для API маршрутов

### ✅ Производительность
- [x] API отвечает менее чем за 500ms
- [x] Эффективная обработка множественных торрентов
- [x] Оптимизированное отображение списков

## Результаты

```
✅ Test Suites: 3 passed, 3 total
✅ Tests: 39 passed, 39 total
✅ Snapshots: 0 total
⏱️ Time: ~1s
```

Все тесты успешно проходят, подтверждая стабильность и надежность приложения T2G!