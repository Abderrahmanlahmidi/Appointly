FROM node:22-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

ENV NODE_ENV=production
ENV PORT=3001

RUN npm run build

EXPOSE 3001

CMD ["sh", "-c", "npm run db:migrate && npm run start:prod"]
