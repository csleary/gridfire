FROM node:16
WORKDIR /root/
COPY --from=csleary/bento4 /root/bento4 /root/bento4
COPY --from=csleary/ffmpeg /root/bin /root/bin
WORKDIR /root/nemp3
COPY . .
RUN apt-get update -qq \
  && apt-get -y install libass-dev libvorbis-dev \
  && npm install --global yarn
COPY dkimKey /root/nemp3/
EXPOSE 8083/tcp
RUN yarn install --production=true