# 📁 T2G Project Structure

## 🎯 О проекте
**T2G (Torrent to Google Drive)** - веб-приложение для загрузки торрентов напрямую в Google Drive.

## 📂 Структура файлов

```
t2g/
├── 🌐 Frontend
│   ├── public/index.html          # Главная страница
│   ├── public/dashboard.html      # Панель управления
│   ├── public/styles.css          # Стили приложения
│   └── public/dashboard.js        # Frontend логика
│
├── ⚙️ Backend
│   ├── server.js                  # Основной сервер Express
│   └── package.json               # Зависимости и скрипты
│
├── 🧪 Tests (39 тестов)
│   ├── tests/server.test.js       # Тесты сервера (15)
│   ├── tests/frontend.test.js     # Тесты frontend (15)
│   ├── tests/integration.test.js  # Интеграционные тесты (9)
│   ├── tests/setup.js             # Настройка тестов
│   └── tests/README.md            # Документация тестов
│
├── 🐳 Docker
│   ├── Dockerfile                 # Основной Docker образ
│   ├── Dockerfile.optimized       # Оптимизированный образ
│   ├── docker-compose.yml         # Docker Compose конфигурация
│   ├── .dockerignore              # Исключения для Docker
│   ├── start-docker.sh            # Автоматический запуск
│   ├── .env.docker                # Шаблон окружения
│   └── DOCKER.md                  # Docker документация
│
├── 📄 Configuration
│   ├── .env.example               # Шаблон переменных
│   ├── .env.test                  # Тестовое окружение
│   └── .gitignore                 # Git исключения
│
└── 📚 Documentation
    ├── README.md                  # Основная документация
    ├── DOCKER.md                  # Docker руководство
    └── PROJECT_INFO.md            # Этот файл
```

## 🚀 Возможности

### ✅ Основные функции
- **Google OAuth** аутентификация
- **Magnet ссылки** и **.torrent файлы**
- **Google Drive** интеграция
- **Real-time** мониторинг торрентов
- **Responsive** веб-интерфейс

### ✅ Docker поддержка
- **Multi-stage** сборка
- **Health checks**
- **Автоматический скрипт** запуска
- **Persistent volumes**
- **Non-root** пользователь

### ✅ Тестирование
- **39 тестов** с 100% прохождением
- **Unit** тесты (функции)
- **Integration** тесты (workflows)
- **Jest + Supertest** framework

## 🔧 Технологии

| Категория | Технологии |
|-----------|------------|
| **Backend** | Node.js, Express.js, Passport.js |
| **Frontend** | Vanilla JS, CSS3, Font Awesome |
| **Authentication** | Google OAuth 2.0 |
| **APIs** | Google Drive API v3 |
| **Torrents** | WebTorrent |
| **Testing** | Jest, Supertest, JSDOM |
| **Containerization** | Docker, Docker Compose |
| **File Upload** | Multer |

## 🚀 Запуск

### Локально
```bash
npm install
npm start
```

### Docker (рекомендуется)
```bash
./start-docker.sh
```

### Тесты
```bash
npm test
npm run test:coverage
```

## 📋 Статус

- ✅ **Разработка**: Завершена
- ✅ **Тестирование**: 39/39 тестов пройдено
- ✅ **Docker**: Готов к продакшену
- ✅ **Документация**: Полная

---

🎉 **Проект готов к использованию!**