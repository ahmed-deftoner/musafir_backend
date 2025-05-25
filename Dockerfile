FROM node:22-alpine

# Create and set the working directory
RUN mkdir -p /var/www/backend
WORKDIR /var/www/backend

# Copy all files to the working directory
ADD . /var/www/backend

# # Set network timeout for npm
# RUN npm config set timeout 600000

# Install dependencies
RUN npm install --f

# Expose the application port
EXPOSE 5001

# Start the application in development mode
CMD [ "npm", "run", "start:dev" ]
