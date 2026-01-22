# --- Этап 1: Сборка (Build) ---
FROM node:20-alpine AS builder

# Рабочая директория
WORKDIR /app

# Копируем package.json и package-lock.json (если есть) для кэширования слоев
COPY package.json package-lock.json* ./

# Устанавливаем зависимости
RUN npm install

# Копируем весь исходный код
COPY . .

# Собираем приложение для продакшена
# (Vite создаст папку dist/)
RUN npx vite build

# --- Этап 2: Продакшн сервер (Nginx) ---
FROM nginx:alpine

# Удаляем дефолтный конфиг Nginx, чтобы не мешал
RUN rm /etc/nginx/conf.d/default.conf

# Копируем НАШ конфиг Nginx
# (предполагается, что файл nginx.conf лежит рядом с Dockerfile)
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Копируем собранные статические файлы из этапа builder
COPY --from=builder /app/dist /usr/share/nginx/html

# Порт 80 стандартный для веб-сервера
EXPOSE 80

# Запускаем Nginx в фоновом режиме
CMD ["nginx", "-g", "daemon off;"]
