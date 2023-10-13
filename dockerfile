# Use the official Node.js image as the base image
FROM node:14.15.1-alpine3.12

# Set the working directory in the container
WORKDIR /home/um

# Copy package.json and package-lock.json to the working directory
COPY package*.json ./

# Install dependencies in the container
RUN npm install

#Install pm2 in the container
RUN npm install pm2 -g

# Copy the content of the local src directory to the working directory
COPY . .

# Specify the command to run on container start
CMD ["pm2-runtime", "start", "pm2.config.js"]
