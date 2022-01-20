import React, { Component, createRef } from "react";
import { faChevronDown, faCog, faPause, faPlay, faStop } from "@fortawesome/free-solid-svg-icons";
import { playTrack, playerHide, playerPause, playerPlay, playerStop } from "features/player";
import { toastError, toastInfo, toastWarning } from "features/toast";
import { Box, Flex, IconButton, Text } from "@chakra-ui/react";
import { Link as RouterLink } from "react-router-dom";
import Icon from "components/icon";
import PropTypes from "prop-types";
import axios from "axios";
import { connect } from "react-redux";
import styles from "./player.module.css";
// import { withRouter } from 'react-router-dom';
const MIME_TYPE = 'audio/mp4; codecs="mp4a.40.2"';

class Player extends Component {
  constructor(props) {
    super(props);

    this.state = {
      bufferRanges: [],
      bufferReachedEnd: false,
      elapsedTime: "",
      isBuffering: false,
      isReady: false,
      showRemaining: false
    };

    this.audioPlayerRef = createRef();
    this.mediaSource = null;
    this.seekBarRef = createRef();
    this.shouldSetDuration = false;
    this.shouldUpdateBuffer = false;
    this.trackDuration = 0;
    this.queue = [];
  }

  componentDidMount() {
    const iPhone = navigator.userAgent.indexOf("iPhone") !== -1;
    const iPad = navigator.userAgent.indexOf("iPad") !== -1;
    const isSupported = MediaSource.isTypeSupported(MIME_TYPE);

    if (iPhone || iPad || !isSupported) {
      return this.props.toastWarning(
        "The mp4 audio format we use is not currently supported by your device. Streaming will be disabled."
      );
    }

    const audioPlayer = this.audioPlayerRef.current;
    const supportsHls =
      audioPlayer.canPlayType("application/vnd.apple.mpegURL") || audioPlayer.canPlayType("application/x-mpegURL");

    if (supportsHls === "probably" || supportsHls === "maybe") {
      console.log("Using HLS.");
    }

    this.mediaSource = new MediaSource();
    audioPlayer.src = URL.createObjectURL(this.mediaSource);
    this.mediaSource.addEventListener("sourceopen", this.handleSourceOpen);
    audioPlayer.addEventListener("loadstart", () => this.setState({ isReady: false }));
    audioPlayer.addEventListener("canplay", () => this.setState({ isReady: true }));
    audioPlayer.addEventListener("play", this.handlePlay);
    audioPlayer.addEventListener("timeupdate", this.handleTimeUpdate);
    audioPlayer.addEventListener("seeking", this.handleSeeking);
    audioPlayer.addEventListener("ended", this.handleTrackEnded);
  }

  async componentDidUpdate(prevProps) {
    if (this.props.player.trackId && this.props.player.trackId !== prevProps.player.trackId) {
      this.audioPlayerRef.current.pause();
      this.queue.length = 0;

      if (this.mediaSource.duration && !this.sourceBuffer.updating) {
        this.sourceBuffer.remove(0, this.mediaSource.duration);
      }

      this.setState({ isBuffering: true, bufferReachedEnd: false, percentComplete: 0, isReady: false }, async () => {
        try {
          await this.fetchInitSegment();
          const buffer = await this.fetchSegment(0, 0);
          this.audioPlayerRef.current.currentTime = 0;
          this.updateBuffer();
          this.appendBuffer(buffer);
          this.handlePlay();
        } catch (error) {
          this.audioPlayerRef.current.pause();
          this.props.playerStop();
          this.setState({ isBuffering: false, isReady: true });
          this.props.toastError(error.message || error.toString());
        }
      });
    }
  }

  componentWillUnmount() {
    if (!this.sourceBuffer.updating && this.mediaSource.readyState === "open") {
      this.mediaSource.endOfStream();
    }
  }

  fetchInitSegment = async () => {
    const { trackId } = this.props.player;
    const resUrl = await axios.get(`/api/track/${trackId}/init`);
    const { duration, url, range } = resUrl.data;
    const config = { headers: { Range: `bytes=${range}` }, responseType: "arraybuffer" };
    const resBuffer = await axios.get(url, config);
    this.initSegment = new Uint8Array(resBuffer.data);
    this.trackDuration = duration;
  };

  fetchSegment = async (time, type) => {
    const { trackId } = this.props.player;
    const resUrl = await axios.get(`/api/track/${trackId}/stream`, { params: { time, type } });
    const { url, range, end } = resUrl.data;
    const config = { headers: { Range: `bytes=${range}` }, responseType: "arraybuffer" };
    const resBuffer = await axios.get(url, config);
    const segment = new Uint8Array(resBuffer.data);
    const buffer = new Uint8Array([...this.initSegment, ...segment]);
    if (end) this.setState({ bufferReachedEnd: true });
    return buffer;
  };

  handleSourceOpen = () => {
    const audioPlayer = this.audioPlayerRef.current;
    URL.revokeObjectURL(audioPlayer.src);
    this.sourceBuffer = this.mediaSource.addSourceBuffer(MIME_TYPE);
    this.sourceBuffer.addEventListener("updateend", this.handleUpdateEnd);
  };

  handlePlay = () => {
    const promisePlay = this.audioPlayerRef.current.play();

    if (promisePlay !== undefined) {
      promisePlay.then(this.props.playerPlay).catch(() => {
        this.audioPlayerRef.current.pause();
        this.audioPlayerRef.current.currentTime = 0;
        this.props.playerStop();
      });
    }
  };

  handleTimeUpdate = async () => {
    const { currentTime } = this.audioPlayerRef.current;
    const percentComplete = currentTime / this.mediaSource.duration;
    let needsBuffer = false;

    if (this.state.bufferReachedEnd && this.state.percentComplete === percentComplete) {
      return this.handleTrackEnded();
    }

    for (let i = 0; i < this.sourceBuffer.buffered.length; i++) {
      if (
        currentTime > this.sourceBuffer.buffered.start(i) &&
        currentTime > this.sourceBuffer.buffered.end(i) - 5 &&
        currentTime < this.sourceBuffer.buffered.end(i) &&
        !this.state.bufferReachedEnd &&
        !this.state.isBuffering &&
        !this.state.isSeeking
      ) {
        needsBuffer = true;
      }
    }

    if (needsBuffer) {
      this.setState({ isBuffering: true }, async () => {
        const buffer = await this.fetchSegment(currentTime, 1);
        this.appendBuffer(buffer);
      });
    }

    const mins = Math.floor(currentTime / 60);
    const secs = Math.floor(currentTime % 60);
    const remainingTime = Math.floor(this.mediaSource.duration - currentTime || 0);
    const remainingMins = Math.floor(remainingTime / 60);
    const remainingSecs = (remainingTime % 60).toString(10).padStart(2, "0");

    this.setState({
      elapsedTime: `${mins}:${secs.toString(10).padStart(2, "0")}`,
      remainingTime: `-${remainingMins}:${remainingSecs}`,
      percentComplete
    });
  };

  handleSeeking = async () => {
    const { currentTime } = this.audioPlayerRef.current;
    if (!currentTime) return;
    let isBuffered = false;

    for (let i = 0; i < this.sourceBuffer.buffered.length; i++) {
      if (currentTime >= this.sourceBuffer.buffered.start(i) && currentTime < this.sourceBuffer.buffered.end(i)) {
        isBuffered = true;
      }
    }

    if (!isBuffered && !this.state.isBuffering) {
      this.setState({ isBuffering: true, isReady: false }, async () => {
        const buffer = await this.fetchSegment(currentTime, 2);
        this.appendBuffer(buffer);
      });
    }
  };

  handleTrackEnded = () => {
    const { trackList } = this.props.release;
    const trackIndex = trackList.findIndex(({ trackTitle }) => trackTitle === this.props.player.trackTitle);

    if (trackList[trackIndex + 1]) {
      const nextTrackId = trackList[trackIndex + 1]._id;
      return this.loadNextTrack(nextTrackId);
    }

    this.audioPlayerRef.current.pause();
    this.audioPlayerRef.current.currentTime = 0;
    this.props.playerStop();
  };

  handleUpdateEnd = e => {
    const { buffered } = e.target;
    const bufferRanges = [];

    for (let i = 0; i < buffered.length; i++) {
      bufferRanges.push([buffered.start(i), buffered.end(i)]);
    }

    if (this.shouldSetDuration) {
      this.mediaSource.duration = this.trackDuration;
      this.shouldSetDuration = false;
      return;
    }

    if (this.queue.length) return this.sourceBuffer.appendBuffer(this.queue.shift());
    this.setState({ bufferRanges, isBuffering: false });
  };

  appendBuffer = buffer => {
    if (this.sourceBuffer.updating) return this.queue.push(buffer);
    this.sourceBuffer.appendBuffer(buffer);
  };

  updateBuffer = () => {
    const oldDuration = Number.isFinite(this.mediaSource.duration) ? this.mediaSource.duration : 0;
    if (this.trackDuration < oldDuration) {
      this.sourceBuffer.remove(this.trackDuration, oldDuration);
      this.shouldSetDuration = true;
    } else {
      this.mediaSource.duration = this.trackDuration;
    }

    this.shouldUpdateBuffer = false;
  };

  loadNextTrack = nextTrackId => {
    const nextTrack = this.props.release.trackList.find(({ _id }) => _id === nextTrackId);

    this.props.playTrack({
      releaseId: this.props.release._id,
      trackId: nextTrack._id,
      artistName: this.props.release.artistName,
      trackTitle: nextTrack.trackTitle
    });
  };

  handlePlayButton = () => {
    if (this.props.player.isPlaying) {
      this.audioPlayerRef.current.pause();
      return this.props.playerPause();
    }

    this.handlePlay();
  };

  handleStop = () => {
    this.audioPlayerRef.current.pause();
    this.audioPlayerRef.current.currentTime = 0;
    this.props.playerStop();
  };

  handleSeek = event => {
    const x = event.clientX;
    const width = this.seekBarRef.current.clientWidth;
    const seekPercent = x / width;
    this.audioPlayerRef.current.currentTime = this.mediaSource.duration * seekPercent;
  };

  handleHidePlayer = () => {
    this.audioPlayerRef.current.pause();
    this.props.playerStop();
    this.props.playerHide();
  };

  render() {
    const { artistName, isPlaying, releaseId, showPlayer, trackTitle } = this.props.player;
    const { isReady } = this.state;

    return (
      <Box
        role="group"
        isOpen={showPlayer}
        background="gray.800"
        bottom="0"
        color="gray.400"
        fontSize="2rem"
        left="0"
        position="fixed"
        right="0"
        transform={showPlayer ? "translateY(0)" : "translateY(100%)"}
        transition="0.5s cubic-bezier(0.2, 0.8, 0.4, 1)"
        visibility={showPlayer ? "visible" : "hidden"}
        zIndex="1030"
      >
        <audio id="player" ref={this.audioPlayerRef} />
        <Box
          onClick={this.handleSeek}
          ref={this.seekBarRef}
          role="button"
          tabIndex="-1"
          background="gray.300"
          height="4px"
          position="relative"
          transition="0.125s cubic-bezier(0.2, 0.8, 0.4, 1)"
          width="100%"
          _groupHover={{ background: "gray.200", cursor: "pointer", height: "8px", marginTop: "6px" }}
        >
          {this.state.bufferRanges.map(([start, end]) => {
            const left = (start / this.mediaSource.duration) * 100;
            const width = ((end - start) / this.mediaSource.duration) * 100;

            return (
              <Box
                key={start}
                background="red.200"
                height="100%"
                left={`${left || 0}%`}
                position="absolute"
                width={`${width || 0}%`}
              />
            );
          })}
          <Box
            background="gray.400"
            height="100%"
            position="absolute"
            transition="0.125s cubic-bezier(0.2, 0.8, 0.4, 1)"
            width={`${this.state.percentComplete * 100}%`}
            _groupHover={{ background: "cyan.200" }}
          />
        </Box>
        <Flex alignItems="center" justifyContent="center" height="3.25rem">
          <IconButton
            icon={<Icon icon={!isReady ? faCog : isPlaying ? faPause : faPlay} fixedWidth />}
            isReady={this.state.isReady}
            onClick={this.handlePlayButton}
            mr={2}
            variant="ghost"
          />
          <IconButton
            icon={<Icon icon={faStop} fixedWidth />}
            onClick={this.handleStop}
            margin="0 0.5rem 0 0"
            transition="color 0.5s cubic-bezier(0.2, 0.8, 0.4, 1)"
            variant="ghost"
          />
          <Box
            role="button"
            onClick={() => this.setState({ showRemaining: !this.state.showRemaining })}
            tabIndex="-1"
            display="inline-block"
            padding="0 1rem"
            textAlign="right"
            transition="0.5s cubic-bezier(0.2, 0.8, 0.4, 1)"
            userSelect="none"
            width="8rem"
            _focus={{ outline: "none" }}
          >
            {this.state.showRemaining ? this.state.remainingTime : this.state.elapsedTime}
          </Box>
          <Flex
            alignItems="center"
            justifyContent={["space-between", "flex-end"]}
            overflow="hidden"
            pl={4}
            textAlign="left"
            textOverflow="ellipsis"
          >
            {!isReady ? (
              <Text>Loading&hellip;</Text>
            ) : "location.pathname" !== `/release/${releaseId}` ? (
              <Text as={RouterLink} to={`/release/${releaseId}`}>
                {artistName} &bull; <Text as="em">{trackTitle}</Text>
              </Text>
            ) : (
              <Text>
                {artistName} &bull; <Text as="em">{trackTitle}</Text>
              </Text>
            )}
            <IconButton
              icon={<Icon icon={faChevronDown} />}
              ml={8}
              onClick={this.handleHidePlayer}
              title="Hide player (will stop audio)"
              variant="ghost"
            />
          </Flex>
        </Flex>
      </Box>
    );
  }
}

Player.propTypes = {
  history: PropTypes.object,
  player: PropTypes.object,
  playerHide: PropTypes.func,
  playerPause: PropTypes.func,
  playerPlay: PropTypes.func,
  playerStop: PropTypes.func,
  playTrack: PropTypes.func,
  release: PropTypes.object,
  toastError: PropTypes.func,
  toastInfo: PropTypes.func,
  toastWarning: PropTypes.func
};

function mapStateToProps(state) {
  return {
    player: state.player,
    release: state.releases.activeRelease
  };
}

export default connect(mapStateToProps, {
  playTrack,
  playerHide,
  playerPause,
  playerPlay,
  playerStop,
  toastError,
  toastInfo,
  toastWarning
})(Player);
