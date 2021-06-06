FROM ubuntu as base
WORKDIR /root
COPY ./id_rsa /root
RUN apt-get update && \
  apt-get -y install git && \
  eval `ssh-agent -s` && \
  mkdir ~/.ssh && \
  mv id_rsa ~/.ssh/ && \
  echo "StrictHostKeyChecking no" >> /etc/ssh/ssh_config && \
  cat /etc/ssh/ssh_config && \
  chmod go-w /root && \
  chmod 700 /root/.ssh && \
  chmod 600 /root/.ssh/id_rsa && \
  ssh-add ~/.ssh/id_rsa && \
  git clone git@github.com:csleary/nemp3.git /root/nemp3

FROM ubuntu AS nemp3
WORKDIR /root/
COPY --from=csleary/bento4 /root/bento4 /root/bento4
COPY --from=csleary/ffmpeg /root/bin /root/bin
WORKDIR /root/nemp3
COPY --from=base /root/nemp3 .
RUN apt-get update -qq \
  && apt-get -y install curl \
  && curl -sL https://deb.nodesource.com/setup_16.x | bash - \
  && apt-get -y install \
  libass-dev \
  libvorbis-dev \
  nodejs \
  && npm install --global yarn
COPY dkimKey /root/nemp3/
EXPOSE 8083/tcp
RUN yarn install --production=true

FROM ubuntu AS nemp3-dev
WORKDIR /root/
COPY --from=csleary/bento4 /root/bento4 /root/bento4
COPY --from=csleary/ffmpeg /root/bin /root/bin
RUN apt-get update -qq \
  && apt-get -y install curl \
  && curl -sL https://deb.nodesource.com/setup_16.x | bash - \
  && apt-get -y install \
  git-core \
  libass-dev \
  libvorbis-dev \
  nodejs
EXPOSE 8083/tcp