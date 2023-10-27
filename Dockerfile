FROM node:18-alpine

RUN mkdir /app

COPY . /app/

WORKDIR /app
RUN npm install

RUN chmod -R 777 /app

CMD npm run start
