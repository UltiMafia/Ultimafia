# Use the official Node.js image as the base image
FROM sitespeedio/node:ubuntu-20.04-nodejs-14.16.0

# Set the working directory in the container
WORKDIR /home/um

# Copy package.json and package-lock.json to the working directory
COPY package*.json ./

# Install dependencies in the container
RUN npm install

# Install pm2 in the container
RUN npm install pm2 -g

# Expose Ports
EXPOSE 80
EXPOSE 2999
EXPOSE 3000
EXPOSE 3010
EXPOSE 9230
EXPOSE 9231
EXPOSE 9232

# Copy the content of the local src directory to the working directory
COPY . .

# Change direcotry to react_main
WORKDIR /home/um/react_main

# Build static site
RUN bash build.sh && echo "Build finished."

# Change directory back to um root
WORKDIR /home/um

# Specify the command to run on container start
CMD ["pm2-runtime", "start", "pm2.json"]
