FROM node:16 as build
WORKDIR /home/node/app
COPY . .
RUN yarn install --production=true
ENTRYPOINT [ "node", "index.js" ]