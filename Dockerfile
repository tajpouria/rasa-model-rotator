FROM node:14.18-slim

WORKDIR /app

COPY package*.json ./

RUN npm ci --only=production

COPY app.js .

CMD [ "node", "app" ]
