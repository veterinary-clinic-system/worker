# Tien trinh nen BullMQ. Build context la CHINH thu muc nay (xem docker-compose.yml
# trong veterinary-clinic-backend/) - moi tien trinh la mot repo doc lap.
# Worker deploy tach roi backend de co the scale rieng va restart ma khong dut request.

FROM node:20-alpine AS build
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM node:20-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

COPY --from=build /app/dist ./dist

CMD ["node", "dist/main.js"]
