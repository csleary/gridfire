FROM node:16-slim as build
COPY --from=csleary/ffmpeg /root/bin /usr/bin
COPY ./bin/packager-linux-x64 /usr/bin
WORKDIR /home/node/app
COPY . .
RUN apt-get update -qq && apt-get -y install libass-dev libvorbis-dev
RUN mkdir /home/node/tmp
RUN yarn install --production --frozen-lockfile
ENTRYPOINT [ "node", "index.js" ]