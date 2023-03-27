# Dockerfile

# Use the official Node.js image as the base image
FROM node:14

# Set the working directory
WORKDIR /app

# Copy package.json and package-lock.json to the working directory
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy the application source code
COPY . .

# Expose the application's port
EXPOSE 3000

# Start the application
CMD ["npm", "run", "dev"]