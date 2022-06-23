FROM node:16
WORKDIR /home/node/app
COPY . .
RUN mkdir /home/node/tmp
RUN yarn install --production=true
ENTRYPOINT [ "node", "index.js" ]