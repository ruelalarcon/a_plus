FROM node:20-alpine

WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm ci

# Copy the rest of the application
COPY . .

# Build the frontend
RUN npm run build

# Expose the application port
EXPOSE 3000

# Entrypoint to run the application
ENTRYPOINT ["node", "server/server.js"]