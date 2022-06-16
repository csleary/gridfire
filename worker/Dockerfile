FROM node:16
COPY --from=csleary/bento4 /root/bento4 /home/node/bento4
COPY --from=csleary/ffmpeg /root/bin /usr/bin
WORKDIR /home/node/app
COPY . .
RUN apt-get update -qq && apt-get -y install libass-dev libvorbis-dev
RUN mkdir tmp
RUN yarn install --production=true
ENTRYPOINT [ "node", "index.js" ]