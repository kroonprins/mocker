FROM node:11.2.0-alpine

WORKDIR /app
COPY ./src/angular .

RUN npm install
RUN npm run build-prod

FROM node:11.2.0-alpine

WORKDIR /app

COPY . .
RUN npm install --ignore-scripts

COPY --from=0 /app/dist /app/src/angular/dist

EXPOSE 3000 3001 3002 3003 3004 3005 3006
CMD ["npm", "start"]
