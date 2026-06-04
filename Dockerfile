FROM node:22-slim

# Install build deps for better-sqlite3
RUN apt-get update && apt-get install -y \
    python3 make g++ \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies needed for the Next.js build and typecheck
RUN npm ci

# Copy source
COPY . .

# Build Next.js
RUN npm run build

# Keep the runtime image smaller after the build is complete
RUN npm prune --omit=dev

# Create data and uploads directories
RUN mkdir -p data uploads

# Expose port
EXPOSE 3000

ENV NODE_ENV=production
ENV PORT=3000

CMD ["npm", "start"]
