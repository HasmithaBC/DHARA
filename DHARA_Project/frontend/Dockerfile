# syntax=docker/dockerfile:1.7
FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN --mount=type=cache,target=/root/.npm \
    npm ci --fetch-retries=5 --fetch-retry-mintimeout=20000 \
    --fetch-retry-maxtimeout=120000 --fetch-timeout=300000

FROM node:20-alpine AS build
WORKDIR /app
# Browser-facing API address is inlined into the client bundle at BUILD time.
# Pass the address visitors' browsers use to reach the API (e.g. https://api.example.com/api/v1).
ARG NEXT_PUBLIC_API_BASE_URL=http://localhost:8080/api/v1
ARG NEXT_PUBLIC_WHATSAPP_NUMBER=94763774551
ARG NEXT_PUBLIC_SITE_URL=http://localhost:3000
ARG BACKEND_URL=http://backend:8080
ENV NEXT_PUBLIC_API_BASE_URL=$NEXT_PUBLIC_API_BASE_URL \
    NEXT_PUBLIC_WHATSAPP_NUMBER=$NEXT_PUBLIC_WHATSAPP_NUMBER \
    NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL \
    BACKEND_URL=$BACKEND_URL
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app/.next ./.next
COPY --from=build /app/public ./public
COPY --from=build /app/package.json ./package.json
COPY --from=build /app/next.config.mjs ./next.config.mjs
COPY --from=build /app/node_modules ./node_modules
EXPOSE 3000
# API_INTERNAL_URL (runtime) is how the Next.js server reaches the API inside Docker.
CMD ["npm", "start"]
