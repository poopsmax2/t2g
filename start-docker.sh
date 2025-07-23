#!/bin/bash

# T2G Docker Startup Script
# Автоматическая настройка и запуск приложения в Docker

echo "🚀 T2G - Torrent to Google Drive Docker Setup"
echo "=============================================="

# Проверяем наличие Docker
if ! command -v docker &> /dev/null; then
    echo "❌ Docker не установлен. Установите Docker и повторите попытку."
    exit 1
fi

# Проверяем наличие Docker Compose
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose не установлен. Установите Docker Compose и повторите попытку."
    exit 1
fi

# Создаем .env файл если его нет
if [ ! -f ".env" ]; then
    echo "📝 Создаем файл окружения..."
    cp .env.docker .env
    echo "✅ Файл .env создан из шаблона .env.docker"
    echo ""
    echo "⚠️  ВАЖНО: Отредактируйте файл .env и добавьте ваши Google OAuth credentials:"
    echo "   - GOOGLE_CLIENT_ID"
    echo "   - GOOGLE_CLIENT_SECRET"
    echo "   - SESSION_SECRET (минимум 32 символа)"
    echo ""
    read -p "Нажмите Enter когда отредактируете .env файл..."
fi

# Создаем необходимые директории
echo "📁 Создаем директории..."
mkdir -p downloads uploads
echo "✅ Директории downloads и uploads созданы"

# Проверяем переменные окружения
echo "🔍 Проверяем конфигурацию..."
if grep -q "your_google_client_id_here" .env; then
    echo "⚠️  Обнаружены placeholder значения в .env файле"
    echo "   Пожалуйста, замените их на реальные значения и запустите скрипт снова"
    exit 1
fi

# Останавливаем предыдущие контейнеры если есть
echo "🛑 Останавливаем предыдущие контейнеры..."
docker-compose down 2>/dev/null || true

# Собираем и запускаем
echo "🔨 Собираем Docker образ..."
docker-compose build

echo "🚀 Запускаем приложение..."
docker-compose up -d

# Ждем запуска
echo "⏳ Ждем запуска приложения..."
sleep 10

# Проверяем статус
if docker-compose ps | grep -q "Up"; then
    echo ""
    echo "🎉 T2G успешно запущен!"
    echo "🌐 Приложение доступно по адресу: http://localhost:3000"
    echo ""
    echo "📋 Полезные команды:"
    echo "   docker-compose logs -f t2g-app  # Просмотр логов"
    echo "   docker-compose ps              # Статус контейнеров" 
    echo "   docker-compose down            # Остановить приложение"
    echo "   docker-compose restart t2g-app # Перезапустить"
    echo ""
else
    echo "❌ Ошибка запуска. Проверьте логи:"
    echo "   docker-compose logs t2g-app"
fi