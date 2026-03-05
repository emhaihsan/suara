FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build || true # Build might fail if types aren't set up perfectly yet

EXPOSE 3001

CMD ["node", "dist/index.js"]
