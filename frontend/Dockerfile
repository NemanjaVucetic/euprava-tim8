# ── Stage 1: Build ──────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# Verify dist was created
RUN ls -la /app/dist

# ── Stage 2: Serve with nginx ────────────────────────────────────
FROM nginx:stable-alpine

# Remove default nginx config and page
RUN rm -rf /usr/share/nginx/html/* && \
    rm -f /etc/nginx/conf.d/default.conf

# Copy built assets from builder
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy our nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Verify files landed
RUN ls -la /usr/share/nginx/html && nginx -t

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]