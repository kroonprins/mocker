FROM node:alpine

WORKDIR /app
COPY . .

RUN npm install

EXPOSE 3000 3001 3002 3003 3004 3005
CMD ["npm", "run", "mock-server"]
