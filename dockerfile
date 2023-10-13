# Use the official Node.js image as the base image
FROM node:14.15.1

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

WORKDIR /home/um/react_main

RUN npm install

RUN npm run build

RUN cp -r build public

WORKDIR /home/um

# RUN pm2-runtime start pm2.config.js

# WORKDIR /home/um/react_main

# RUN npm start

# Specify the command to run on container start
CMD npm start --verbose;cd react_main;npm start;/bin/bash
