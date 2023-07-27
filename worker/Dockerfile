FROM node:16-slim as build
WORKDIR /home/node/app
COPY . .
RUN yarn install --production --frozen-lockfile
RUN yarn tsc

FROM node:16-slim
WORKDIR /home/node/app
COPY --from=build /home/node/app/dist .
COPY --from=csleary/ffmpeg /root/bin /usr/bin
COPY ./bin/packager-linux-x64 /usr/bin
RUN apt-get update -qq && apt-get -y install libass-dev libvorbis-dev
RUN mkdir /home/node/tmp
EXPOSE 9090
ENTRYPOINT [ "node", "index.js" ]