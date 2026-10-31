FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json tsconfig.json vite.config.ts ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=8943
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
VOLUME ["/app/data"]
EXPOSE 8943
USER node
CMD ["node", "dist/index.js"]
