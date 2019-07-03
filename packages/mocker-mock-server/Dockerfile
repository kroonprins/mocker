FROM node:12.5.0-alpine

WORKDIR /app
COPY . .

RUN npm install

EXPOSE 3000 3006 3007
CMD ["npm", "start"]
