FROM node:20 AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npx prisma generate
RUN npm prune --production

FROM node:20
WORKDIR /app
COPY --from=builder /app ./
EXPOSE 3005
CMD ["npm", "run", "start"]
