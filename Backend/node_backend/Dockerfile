# Stage 1: Build the TypeScript code
FROM node:18-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files and install dependencies
COPY package.json package-lock.json ./
RUN npm ci

# Copy all source code and build the project
COPY . .
RUN npx prisma generate
RUN npm run build
# This assumes your package.json has a "build" script like "build": "tsc"

# ---

# Stage 2: Create the final production image
FROM node:18-alpine

WORKDIR /app

# Copy only production dependencies from builder
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/package-lock.json ./package-lock.json
RUN npm ci --omit=dev

# Copy the compiled JavaScript code from builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
# Copy config files (non-TS assets) required at runtime, e.g. gcp_cred.json
# The TypeScript build does not copy these into dist, so include them explicitly
COPY --from=builder /app/src/config ./dist/config
# Command to run the app
# It will listen on the $PORT variable we set in Step 1
CMD ["node", "dist/index.js"]