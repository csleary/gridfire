FROM node:18-slim as build
WORKDIR /home/node/app
COPY . .
RUN yarn install --frozen-lockfile
RUN yarn tsc

FROM node:18-slim
WORKDIR /home/node/app
COPY --from=build /home/node/app/dist .
COPY --from=csleary/ffmpeg /root/bin /usr/bin
COPY ./bin/packager-linux-x64 /usr/bin
RUN apt-get update -qq && apt-get -y install libass-dev libvorbis-dev
RUN mkdir /home/node/tmp
COPY package.json yarn.lock ./
RUN yarn install --production --frozen-lockfile
EXPOSE 9090
ENTRYPOINT [ "node", "index.js" ]