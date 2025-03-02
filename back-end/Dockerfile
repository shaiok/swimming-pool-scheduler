# Use an official Node.js runtime as the base image
FROM node:18

# Set the working directory inside the container
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the backend code
COPY . .

# Compile TypeScript (if you're using it)
RUN npm run build

# Expose the backend port (adjust if needed)
EXPOSE 5000

# Start the application
CMD ["npm", "run", "start"]
