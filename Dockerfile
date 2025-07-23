# Используем официальный Node.js образ как базовый
FROM node:18-alpine

# Устанавливаем wget для health checks
RUN apk add --no-cache wget

# Устанавливаем рабочую директорию в контейнере
WORKDIR /app

# Копируем package.json и package-lock.json для установки зависимостей
COPY package*.json ./

# Устанавливаем зависимости
RUN npm ci --only=production

# Копируем исходный код приложения
COPY . .

# Создаем необходимые директории
RUN mkdir -p downloads uploads

# Создаем пользователя без root привилегий
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001

# Устанавливаем права на директории
RUN chown -R nodejs:nodejs /app/downloads /app/uploads

# Переключаемся на непривилегированного пользователя
USER nodejs

# Открываем порт 3000
EXPOSE 3000

# Устанавливаем переменную окружения для продакшена
ENV NODE_ENV=production

# Команда для запуска приложения
CMD ["npm", "start"]