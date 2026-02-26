FROM node:24.12.0-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production=false
COPY . .
EXPOSE 5173
CMD ["npm", "run", "dev"]