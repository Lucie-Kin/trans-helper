FROM node:20-bullseye-slim
WORKDIR /app

RUN apt-get update \
  && apt-get install -y --no-install-recommends sqlite3 \
  && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json tsconfig.json ./
COPY sql ./sql
COPY entrypoint.sh ./

RUN npm install


COPY src ./src

RUN npx tsc

RUN mkdir -p /app/data \
  && chown -R node:node /app

EXPOSE 3003
ENTRYPOINT ["/bin/sh", "./entrypoint.sh"]