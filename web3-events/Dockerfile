FROM node:16 as build
WORKDIR /home/node/app
COPY . .
RUN yarn install --frozen-lockfile
RUN yarn tsc

FROM node:16-slim
WORKDIR /home/node/app
COPY package.json yarn.lock ./
RUN yarn install --production --frozen-lockfile
COPY --from=build /home/node/app/dist .
EXPOSE 9090
ENTRYPOINT [ "node", "index.js" ]