FROM node:16-slim as build
WORKDIR /home/node/app
COPY . .
RUN yarn install --production --frozen-lockfile
RUN yarn tsc

FROM node:16-slim
WORKDIR /home/node/app
COPY --from=build /home/node/app/dist .
RUN mkdir /home/node/tmp
EXPOSE 9090
ENTRYPOINT [ "node", "index.js" ]