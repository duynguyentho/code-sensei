FROM node:18-alpine as development

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm install glob rimraf

RUN npm install --only=development

COPY . .

RUN npm run build

CMD [ "npm", "run", "start:dev" ]