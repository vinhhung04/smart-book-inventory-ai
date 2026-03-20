FROM node:20 AS builder
WORKDIR /app
COPY package*.json ./
COPY package-lock.json ./
RUN npm ci
COPY . .
# Generate Prisma Client
RUN npx prisma generate
RUN npm prune --production

FROM node:20
WORKDIR /app
COPY --from=builder /app ./
EXPOSE 3001
CMD ["node", "src/index.js"]