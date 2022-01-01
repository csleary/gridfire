FROM node:16
WORKDIR /root/
COPY --from=csleary/bento4 /root/bento4 /root/bento4
COPY --from=csleary/ffmpeg /root/bin /root/bin
WORKDIR /home/node/app
COPY . .
RUN apt-get update -qq && apt-get -y install libass-dev libvorbis-dev
RUN yarn install --production=true
ENTRYPOINT [ "node index.js" ]