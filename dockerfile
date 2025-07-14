# Use the official Node.js image as the base image
FROM sitespeedio/node:ubuntu-22.04-nodejs-16.14.2

# Install Supervisor
RUN apt-get update && apt-get install -y supervisor

# Copy Supervisor config file to proper directory
COPY supervisord.conf /etc/supervisor/conf.d/supervisord.conf

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
EXPOSE 3001
EXPOSE 3010
EXPOSE 5858
EXPOSE 9230
EXPOSE 9231
EXPOSE 9232

# Copy the content of the local src directory to the working directory
COPY . .

# Change directory to react_main
WORKDIR /home/um/react_main

RUN npm install

# Build static site
RUN bash build.sh && echo "Build finished."

# Change directory back to um root
WORKDIR /home/um

# Specify the command to run on container start
CMD ["/usr/bin/supervisord", "-c", "/etc/supervisor/conf.d/supervisord.conf"]