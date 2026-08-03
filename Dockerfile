# Tien trinh nen BullMQ. Build context la thu muc goc cua monorepo (xem docker-compose.yml).
# Worker deploy tach roi api de co the scale rieng va restart ma khong dut request nguoi dung.

FROM node:20-alpine AS build
WORKDIR /repo

COPY package.json ./
COPY packages/contracts/package.json packages/contracts/
COPY apps/worker/package.json apps/worker/
RUN npm install --workspace @vetcare/worker --workspace @vetcare/contracts --include-workspace-root

COPY packages/contracts packages/contracts
COPY apps/worker apps/worker
RUN npm run build --workspace @vetcare/contracts \
 && npm run build --workspace @vetcare/worker

FROM node:20-alpine AS runtime
WORKDIR /repo
ENV NODE_ENV=production

COPY package.json ./
COPY packages/contracts/package.json packages/contracts/
COPY apps/worker/package.json apps/worker/
RUN npm install --omit=dev --workspace @vetcare/worker --workspace @vetcare/contracts --include-workspace-root

COPY --from=build /repo/packages/contracts/dist packages/contracts/dist
COPY --from=build /repo/apps/worker/dist apps/worker/dist

CMD ["node", "apps/worker/dist/main.js"]
