FROM node:20-alpine

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm install

COPY . .

# Build step if needed, but tsx can run directly. 
# For production, you might want to compile to JS.
# RUN npm run build

EXPOSE 3002

CMD ["npm", "start"]
