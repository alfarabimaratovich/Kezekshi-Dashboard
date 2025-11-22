# ---------- 1. Сборка фронта ----------
FROM node:22-alpine AS build

WORKDIR /app

# Включаем pnpm через corepack
RUN corepack enable

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

COPY . .
RUN pnpm run build    # результат в /app/dist

# ---------- 2. Nginx с готовым билдом ----------
FROM nginx:1.27-alpine

# Удалим дефолтный конфиг и подложим свой
RUN rm /etc/nginx/conf.d/default.conf

# Копируем наш серверный конфиг
COPY docker/nginx/conf.d/frontend.conf /etc/nginx/conf.d/frontend.conf

# Копируем статические файлы
COPY --from=build /app/dist /usr/share/nginx/html

# Папка с сертификатами (будет замаплена volume’ом)
RUN mkdir -p /etc/nginx/certs

EXPOSE 80 443

CMD ["nginx", "-g", "daemon off;"]
