# docker run --rm -it \
#  -v "$PWD":/app -w /app \
#  -e DATABASE_URL="file:./prisma/dev.db" \
#  node:bullseye \
#  bash -lc "npx --yes prisma@6.14.0 migrate dev --name init && npx prisma generate" 

FROM node:20-bullseye-slim

WORKDIR /app

RUN chmod +rwx /app

COPY package.json package-lock.json tsconfig.json ./
# COPY src ./src
COPY sql ./sql
COPY entrypoint.sh ./

RUN npm install
RUN npm install typescript

RUN chown -R node:node /app
USER node

EXPOSE 3003

ENTRYPOINT ["/bin/sh", "./entrypoint.sh"]
