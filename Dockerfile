FROM node:16
WORKDIR /home/node/app
COPY . .
COPY dkimKey /home/node/app
EXPOSE 5000/tcp
RUN yarn install --production=true