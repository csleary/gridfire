FROM node:18-slim as build
WORKDIR /home/node/app
COPY . .
RUN yarn install --frozen-lockfile
RUN yarn tsc

FROM node:18-slim
WORKDIR /home/node/app
COPY package.json yarn.lock ./
RUN yarn install --production --frozen-lockfile
COPY --from=build /home/node/app/dist .
RUN mkdir /home/node/tmp
EXPOSE 9090
ENTRYPOINT [ "node", "index.js" ]