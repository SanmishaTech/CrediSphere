# Use official Node.js LTS image
FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies
COPY package.json package-lock.json* pnpm-lock.yaml* yarn.lock* ./
RUN \
  if [ -f package-lock.json ]; then npm ci; \
  elif [ -f pnpm-lock.yaml ]; then npm install -g pnpm && pnpm install; \
  elif [ -f yarn.lock ]; then yarn install --frozen-lockfile; \
  else npm install; fi

# Copy source files
COPY . .

# Build the app
RUN npm run build

# Production image
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

# Install serve to serve the build folder
RUN npm install -g serve

# Copy build output
COPY --from=builder /app/dist ./dist

EXPOSE 80

# Serve the dist folder on port 80
CMD ["serve", "-s", "dist", "-l", "80"]
# CMD ["npm", "start"]