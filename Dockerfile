# Stage 1: Build the React application
FROM node:20-alpine AS build-stage
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Stage 2: Runtime
FROM python:3.11-slim
WORKDIR /app

# Install Nginx and dos2unix (to handle Windows line endings in entrypoint.sh)
RUN apt-get update \
    && apt-get install -y nginx dos2unix \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy built React assets → Nginx serve directory
COPY --from=build-stage /app/dist /var/www/html

# Copy monitoring script, URL list, and entrypoint
COPY monitor.py .
COPY urls.json .
COPY entrypoint.sh .

# Fix Windows CRLF line endings and make script executable
RUN dos2unix entrypoint.sh && chmod +x entrypoint.sh

# Expose HTTP port
EXPOSE 80

CMD ["./entrypoint.sh"]
