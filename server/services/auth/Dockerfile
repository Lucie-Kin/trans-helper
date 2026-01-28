FROM node:20-bullseye-slim

WORKDIR /app

RUN apt update \
 && apt install -y sqlite3 \
 && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json* ./
RUN npm install

COPY . .

RUN npm run build

EXPOSE 3001

CMD ["npm", "run", "start"]
