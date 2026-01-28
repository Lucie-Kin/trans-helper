#server/services/chat/Dockerfile

FROM node:20-bullseye-slim

WORKDIR /chat

COPY package.json package-lock.json* ./
RUN npm install

COPY . .

RUN npm run build

EXPOSE 3002

CMD ["npm", "run", "start"]
