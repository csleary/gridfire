FROM node:16
WORKDIR /home/node/app
COPY . .
RUN mkdir tmp
RUN yarn install --production=true
ENTRYPOINT [ "node", "index.js" ]