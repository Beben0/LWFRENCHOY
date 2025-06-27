FROM node:18-alpine

WORKDIR /app

# Install dependencies
RUN apk add --no-cache libc6-compat

# Copy package files
COPY package.json package-lock.json* ./

# Install npm dependencies (including devDependencies for development)
RUN npm install --include=dev

# Copy source code
COPY . .

# Expose port
EXPOSE 3000

# Start in development mode  
CMD ["npm", "run", "dev"] 