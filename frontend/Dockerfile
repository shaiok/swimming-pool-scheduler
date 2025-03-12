# Use the official Node LTS image
FROM node:18

# Create app directory inside the container
WORKDIR /app

# Copy package.json and lock files first to install dependencies
COPY package.json package-lock.json ./
RUN npm install

# Copy the rest of your app code into the container
COPY . .

# (Optional) Install Expo CLI globally if you prefer 'expo' instead of 'npx expo'
RUN yarn global add expo-cli

# Expose the ports used by Expo
EXPOSE 19000
EXPOSE 19001
EXPOSE 19002

# Start the Expo dev server using LAN mode
CMD ["npx", "expo", "start", "--lan"]
