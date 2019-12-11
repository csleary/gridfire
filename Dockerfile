FROM ubuntu AS nemp3-dev
WORKDIR /root/
COPY --from=csleary/bento4 /root/bento4 /root/bento4
COPY --from=csleary/ffmpeg /root/bin /root/bin

RUN apt-get update -qq \
  && apt-get -y install curl \
  && curl -sL https://deb.nodesource.com/setup_12.x | bash - \
  && apt-get -y install \
  git-core \
  libass-dev \
  libvorbis-dev \
  nodejs \
  && npm i -g nodemon@2.0.0

EXPOSE 8083/tcp