FROM node:16-alpine
WORKDIR /app

COPY package.json ./
COPY package-lock.json ./

RUN npm install

COPY . .
RUN cp -n config-default.js config.js

EXPOSE 8080

CMD [ "npm", "run", "demo" ]
