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

EXPOSE 2999
EXPOSE 3000
EXPOSE 3010
EXPOSE 9229
EXPOSE 9230
EXPOSE 9231

# Copy the content of the local src directory to the working directory
COPY . .

# Specify the command to run on container start
CMD ["pm2", "start", "pm2.json"]
