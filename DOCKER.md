# 🐳 T2G Docker Guide

Полное руководство по запуску T2G (Torrent to Google Drive) в Docker контейнере.

## 🚀 Быстрый старт

### 1. Автоматический запуск (рекомендуется)

```bash
# Склонируйте репозиторий
git clone <repository-url>
cd t2g

# Запустите автоматический скрипт
./start-docker.sh
```

Скрипт автоматически:
- ✅ Проверит наличие Docker и Docker Compose
- ✅ Создаст файл `.env` из шаблона
- ✅ Попросит настроить Google OAuth credentials
- ✅ Создаст необходимые директории
- ✅ Соберет и запустит контейнер
- ✅ Покажет статус и полезные команды

### 2. Ручной запуск

```bash
# 1. Настройка окружения
cp .env.docker .env
# Отредактируйте .env с вашими credentials

# 2. Запуск с Docker Compose
docker-compose up -d --build

# 3. Проверка статуса
docker-compose ps
```

## 📋 Файлы конфигурации

| Файл | Описание |
|------|----------|
| `Dockerfile` | Основной Docker образ |
| `Dockerfile.optimized` | Оптимизированный мультистейдж образ |
| `docker-compose.yml` | Конфигурация Docker Compose |
| `.dockerignore` | Исключения для сборки |
| `.env.docker` | Шаблон переменных окружения |
| `start-docker.sh` | Автоматический скрипт запуска |

## 🔧 Команды управления

### Основные команды

```bash
# Запуск в фоне
docker-compose up -d

# Остановка
docker-compose down

# Перезапуск
docker-compose restart t2g-app

# Просмотр логов
docker-compose logs -f t2g-app

# Статус контейнеров
docker-compose ps
```

### Команды сборки

```bash
# Пересборка образа
docker-compose build

# Пересборка без кэша
docker-compose build --no-cache

# Запуск с пересборкой
docker-compose up --build
```

### Команды обслуживания

```bash
# Очистка неиспользуемых образов
docker system prune

# Просмотр использования ресурсов
docker stats t2g-torrent-app

# Подключение к контейнеру
docker exec -it t2g-torrent-app /bin/sh
```

## 🔐 Переменные окружения

### Обязательные переменные

```env
# Google OAuth (получите в Google Cloud Console)
GOOGLE_CLIENT_ID=your_client_id_here
GOOGLE_CLIENT_SECRET=your_client_secret_here

# Секретный ключ сессий (минимум 32 символа)
SESSION_SECRET=your_super_secret_key_32_chars_min
```

### Опциональные переменные

```env
# Порт приложения (по умолчанию 3000)
PORT=3000

# Режим работы
NODE_ENV=production
```

## 📁 Тома и данные

### Персистентное хранение

Docker Compose автоматически создает тома для:

- `./downloads` → `/app/downloads` - загруженные торренты
- `./uploads` → `/app/uploads` - временные файлы

### Очистка данных

```bash
# Удаление томов с данными
docker-compose down -v

# Ручная очистка директорий
rm -rf downloads uploads
```

## 🏥 Мониторинг и диагностика

### Health Checks

Контейнер включает автоматические проверки здоровья:

```yaml
healthcheck:
  test: wget --quiet --tries=1 --spider http://localhost:3000/
  interval: 30s
  timeout: 10s
  retries: 3
  start_period: 40s
```

### Просмотр health status

```bash
# Статус контейнера
docker inspect --format='{{.State.Health.Status}}' t2g-torrent-app

# Детальная информация
docker inspect t2g-torrent-app | grep -A 5 Health
```

### Логи и отладка

```bash
# Все логи
docker-compose logs t2g-app

# Последние 50 строк
docker-compose logs --tail=50 t2g-app

# Следить за логами в реальном времени
docker-compose logs -f t2g-app

# Логи с временными метками
docker-compose logs -t t2g-app
```

## 🔧 Troubleshooting

### Частые проблемы

#### 1. Контейнер не запускается

```bash
# Проверьте логи
docker-compose logs t2g-app

# Проверьте переменные окружения
docker-compose config

# Проверьте .env файл
cat .env
```

#### 2. Порт уже занят

```bash
# Найти процесс на порту 3000
lsof -i :3000

# Изменить порт в docker-compose.yml
ports:
  - "3001:3000"  # Внешний порт 3001
```

#### 3. Проблемы с правами доступа

```bash
# Исправить права на директории
sudo chown -R $USER:$USER downloads uploads

# Пересоздать контейнер
docker-compose down
docker-compose up -d
```

#### 4. Ошибки OAuth

- ✅ Проверьте правильность CLIENT_ID и CLIENT_SECRET
- ✅ Убедитесь что redirect URI корректный
- ✅ Проверьте что Google Drive API включен

### Полная переустановка

```bash
# Остановить и удалить все
docker-compose down -v
docker rmi t2g_t2g-app
docker system prune -f

# Запустить заново
./start-docker.sh
```

## 🚀 Продакшн развертывание

### Рекомендации для продакшна

1. **Используйте HTTPS**:
   ```yaml
   # В docker-compose.yml
   labels:
     - "traefik.http.routers.t2g.tls=true"
   ```

2. **Ограничьте ресурсы**:
   ```yaml
   deploy:
     resources:
       limits:
         cpus: '0.5'
         memory: 512M
   ```

3. **Настройте reverse proxy** (nginx/traefik)

4. **Используйте внешний volume** для данных

5. **Настройте backup** директорий downloads/uploads

### Пример для VPS

```bash
# На сервере
git clone <repo-url>
cd t2g

# Настройка
cp .env.docker .env
nano .env  # Заполните credentials

# Запуск
docker-compose up -d --build

# Настройка nginx (если нужно)
# Redirect 80 -> 3000
```

## 📊 Оптимизация

### Использование оптимизированного Dockerfile

```bash
# Переименовать для использования
mv Dockerfile Dockerfile.simple
mv Dockerfile.optimized Dockerfile

# Пересобрать
docker-compose build --no-cache
```

### Мониторинг ресурсов

```bash
# Использование памяти и CPU
docker stats t2g-torrent-app

# Размер образов
docker images | grep t2g

# Размер томов
docker system df
```

---

## 🆘 Поддержка

Если возникли проблемы:

1. **Проверьте логи**: `docker-compose logs t2g-app`
2. **Прочитайте основной README.md**
3. **Проверьте переменные окружения**
4. **Убедитесь что порты свободны**
5. **Попробуйте полную переустановку**

🎉 **Готово!** Ваше приложение T2G работает в Docker!