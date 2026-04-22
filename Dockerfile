# Stage 1: Build the React application
FROM node:20-alpine as build-stage
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Stage 2: Runtime
FROM python:3.11-slim
WORKDIR /app

# Install Nginx
RUN apt-get update && apt-get install -y nginx && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy built assets from build-stage to Nginx default directory
COPY --from=build-stage /app/dist /var/www/html
# previously                     //usr/share/nginx/html
# Possibly need to change to     /var/www/html

# Copy monitoring script and urls
COPY monitor.py .
COPY urls.json .
COPY entrypoint.sh .

# Expose port 80
EXPOSE 80

# Fix Windows line endings and make entrypoint script executable
RUN apt-get update && apt-get install -y dos2unix && dos2unix entrypoint.sh && chmod +x entrypoint.sh

# Run the entrypoint script
CMD ["./entrypoint.sh"]
