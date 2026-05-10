FROM node:20-bookworm-slim

WORKDIR /app/backend

COPY package*.json ./
RUN npm ci --omit=dev

COPY src ./src
COPY scripts ./scripts
COPY data ./data

EXPOSE 5000

CMD ["npm", "start"]