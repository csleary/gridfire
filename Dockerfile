FROM ubuntu AS ffmpeg
RUN apt-get update -qq && apt-get -y install \
  autoconf \
  automake \
  build-essential \
  cmake \
  git-core \
  libass-dev \
  libfreetype6-dev \
  libtool \
  libvorbis-dev \
  nasm \
  pkg-config \
  texinfo \
  wget \
  zlib1g-dev
RUN mkdir -p ~/ffmpeg_sources ~/bin
WORKDIR /root/ffmpeg_sources
RUN git -C fdk-aac pull 2> /dev/null || git clone --depth 1 https://github.com/mstorsjo/fdk-aac \
  && cd fdk-aac \
  && autoreconf -fiv \
  && ./configure --prefix="$HOME/ffmpeg_build" --disable-shared \
  && make -j8 \
  && make install
RUN wget -O lame-3.100.tar.gz https://downloads.sourceforge.net/project/lame/lame/3.100/lame-3.100.tar.gz \
  && tar xzvf lame-3.100.tar.gz \
  && cd lame-3.100 \
  && PATH="$HOME/bin:$PATH" ./configure --prefix="$HOME/ffmpeg_build" --bindir="$HOME/bin" --disable-shared --enable-nasm \
  && PATH="$HOME/bin:$PATH" make -j8 \
  && make install
RUN git -C opus pull 2> /dev/null || git clone --depth 1 https://github.com/xiph/opus.git \
  && cd opus \
  && ./autogen.sh \
  && ./configure --prefix="$HOME/ffmpeg_build" --disable-shared \
  && make -j8 \
  && make install
RUN wget -O ffmpeg-snapshot.tar.bz2 https://ffmpeg.org/releases/ffmpeg-snapshot.tar.bz2 \
  && tar xjvf ffmpeg-snapshot.tar.bz2 \
  && cd ffmpeg \
  && PATH="$HOME/bin:$PATH" PKG_CONFIG_PATH="$HOME/ffmpeg_build/lib/pkgconfig" ./configure \
  --prefix="$HOME/ffmpeg_build" \
  --pkg-config-flags="--static" \
  --extra-cflags="-I$HOME/ffmpeg_build/include" \
  --extra-ldflags="-L$HOME/ffmpeg_build/lib" \
  --extra-libs="-lpthread -lm" \
  --bindir="$HOME/bin" \
  --enable-gpl \
  --enable-libass \
  --enable-libfdk-aac \
  --enable-libfreetype \
  --enable-libmp3lame \
  --enable-libopus \
  --enable-libvorbis \
  --enable-nonfree \
  && PATH="$HOME/bin:$PATH" make -j8 \
  && make install \
  && hash -r

FROM ubuntu AS bento4
WORKDIR /root/
COPY --from=ffmpeg /root/bin /root/bin
RUN apt-get update -qq \
  && apt-get -y install \
  unzip \
  wget
RUN wget http://zebulon.bok.net/Bento4/binaries/Bento4-SDK-1-5-1-629.x86_64-unknown-linux.zip \
  && unzip Bento4-SDK-1-5-1-629.x86_64-unknown-linux.zip \
  && mv Bento4-SDK-1-5-1-629.x86_64-unknown-linux bento4 \
  && rm Bento4-SDK-1-5-1-629.x86_64-unknown-linux.zip

FROM ubuntu AS nemp3
WORKDIR /root/
COPY --from=bento4 /root/bento4 /root/bento4
COPY --from=bento4 /root/bin /root/bin
WORKDIR /root/nemp3
RUN apt-get update -qq \
  && apt-get -y install curl \
  && curl -sL https://deb.nodesource.com/setup_12.x | bash - \
  && apt-get -y install \
  curl \
  git-core \
  libass-dev \
  libvorbis-dev \
  nodejs \
  && git clone https://github.com/csleary/nemp3.git .
COPY dkimKey /root/nemp3/
EXPOSE 8083/tcp
RUN npm i --only=production

FROM ubuntu AS nemp3-dev
WORKDIR /root/
COPY --from=bento4 /root/bento4 /root/bento4
COPY --from=bento4 /root/bin /root/bin
RUN apt-get update -qq \
  && apt-get -y install curl \
  && curl -sL https://deb.nodesource.com/setup_12.x | bash - \
  && apt-get -y install \
  git-core \
  libass-dev \
  libvorbis-dev \
  nodejs \
  && npm i -g nodemon
EXPOSE 8083/tcp