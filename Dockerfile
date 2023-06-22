FROM node:16-slim
WORKDIR /home/node/app
COPY . .
RUN mkdir /home/node/tmp
RUN yarn install --production --frozen-lockfile
ENTRYPOINT [ "node", "index.js" ]