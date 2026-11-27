# Use the official Node.js image as the base image
FROM node:22.17.0

# Set the working directory in the container
WORKDIR /home/um

# Copy package.json and package-lock.json to the working directory
COPY package*.json ./

# Install dependencies in the container
RUN npm install

# Install pm2 in the container
RUN npm install pm2 -g

# Expose Ports
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

# The backend writes into logs/ and uploads/. Create them in the image and run
# the process as the unprivileged node user (uid 1000) instead of root. In dev
# and production these paths are bind mounts, so the host directories must be
# writable by that uid too; scripts/check-deploy-ownership.sh reports that.
RUN mkdir -p logs/chat logs/games uploads \
    && chown -R node:node logs uploads

USER node

# Specify the command to run on container start
CMD ["pm2-runtime", "start", "pm2.json"]