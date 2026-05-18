FROM node:22-alpine

WORKDIR /app

RUN apk add --no-cache libc6-compat

COPY package*.json ./
RUN npm ci

COPY . .

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
ENV NEXT_TELEMETRY_DISABLED=1

EXPOSE 3000

CMD ["sh", "-c", "npm run build && npm run start -- -H 0.0.0.0 -p 3000"]
