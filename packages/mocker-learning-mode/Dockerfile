FROM node:11.2.0-alpine

WORKDIR /app
COPY . .

RUN npm install

EXPOSE 3002 3008
CMD ["npm", "start"]
