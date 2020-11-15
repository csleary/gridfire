import React, { Component, createRef } from 'react';
import { playTrack, playerHide, playerPause, playerPlay, playerStop } from 'features/player';
import { toastError, toastInfo, toastWarning } from 'features/toast';
import FontAwesome from 'react-fontawesome';
import PlayButton from './playButton';
import PropTypes from 'prop-types';
import TrackInfo from './trackInfo';
import axios from 'axios';
import classNames from 'classnames';
import { connect } from 'react-redux';
import styles from './player.module.css';
import { withRouter } from 'react-router-dom';
const MIME_TYPE = 'audio/mp4; codecs="mp4a.40.2"';

class Player extends Component {
  constructor(props) {
    super(props);

    this.state = {
      autoStartDisabled: false,
      bufferReachedEnd: false,
      elapsedTime: '',
      isBuffering: false,
      isReady: false,
      isSeeking: false,
      showRemaining: false
    };

    this.audioPlayerRef = createRef();
    this.isNewTrack = false;
    this.mediaSource = null;
    this.seekBarRef = createRef();
    this.shouldSetDuration = false;
    this.shouldUpdateBuffer = false;
    this.trackDuration = 0;
    this.queue = [];
  }

  componentDidMount() {
    const iPhone = navigator.userAgent.indexOf('iPhone') !== -1;
    const iPad = navigator.userAgent.indexOf('iPad') !== -1;
    const isSupported = MediaSource.isTypeSupported(MIME_TYPE);

    if (iPhone || iPad || !isSupported) {
      return this.props.toastWarning(
        'The mp4 audio format we use is not currently supported by your device. Streaming will be disabled.'
      );
    }

    this.mediaSource = new MediaSource();
    const audioPlayer = this.audioPlayerRef.current;
    audioPlayer.src = URL.createObjectURL(this.mediaSource);
    this.mediaSource.addEventListener('sourceopen', this.handleSourceOpen);
    audioPlayer.addEventListener('loadstart', () => this.setState({ isReady: false }));
    audioPlayer.addEventListener('canplay', () => this.setState({ isReady: true }));
    audioPlayer.addEventListener('play', this.handlePlay);
    audioPlayer.addEventListener('timeupdate', this.handleTimeUpdate);
    audioPlayer.addEventListener('seeking', this.handleSeeking);
    audioPlayer.addEventListener('ended', this.handleTrackEnded);
  }

  async componentDidUpdate(prevProps) {
    if (this.props.player.trackId && this.props.player.trackId !== prevProps.player.trackId) {
      this.audioPlayerRef.current.pause();
      this.queue.length = 0;
      this.isNewTrack = true;
      if (this.mediaSource.duration) this.sourceBuffer.remove(0, this.mediaSource.duration);
      this.setState({ bufferReachedEnd: false, percentComplete: 0, isReady: false });
      await this.fetchInitSegment();
      const buffer = await this.fetchSegment();
      this.audioPlayerRef.current.currentTime = 0;
      this.handleUpdateBuffer();
      this.handleAppendBuffer(buffer);
      this.handlePlay();
    }
  }

  componentWillUnmount() {
    if (!this.sourceBuffer.updating && this.mediaSource.readyState === 'open') {
      this.mediaSource.endOfStream();
    }
  }

  handleBufferUpdateEnd = () => {
    if (this.shouldUpdateBuffer) {
      this.handleUpdateBuffer();
    } else if (this.shouldSetDuration) {
      this.handleUpdateDuration();
    } else if (this.queue.length) {
      this.sourceBuffer.appendBuffer(this.queue.shift());
    }

    this.setState({ isSeeking: false, isBuffering: false });
  };

  handleSeeking = () => {
    const { currentTime } = this.audioPlayerRef.current;
    let isBuffered;

    for (let i = 0; i < this.sourceBuffer.buffered.length; i++) {
      if (currentTime >= this.sourceBuffer.buffered.start(i) && currentTime < this.sourceBuffer.buffered.end(i)) {
        isBuffered = true;
        break;
      }

      isBuffered = false;
    }

    if (!isBuffered && !this.isNewTrack) {
      this.currentSegment = Math.floor(currentTime / 15);

      this.setState({ bufferReachedEnd: false, isReady: false, isSeeking: true, isBuffering: true }, async () => {
        const buffer = await this.fetchSegment();
        this.handleAppendBuffer(buffer);
      });
    }
  };

  handleSourceOpen = () => {
    const audioPlayer = this.audioPlayerRef.current;
    URL.revokeObjectURL(audioPlayer.src);
    this.sourceBuffer = this.mediaSource.addSourceBuffer(MIME_TYPE);
    this.sourceBuffer.addEventListener('updateend', this.handleBufferUpdateEnd);
  };

  handleTimeUpdate = () => {
    const { currentTime } = this.audioPlayerRef.current;
    const percentComplete = (currentTime / this.mediaSource.duration) * 100;

    if (this.state.bufferReachedEnd && this.state.percentComplete === percentComplete) {
      return this.handleTrackEnded();
    }

    let needsBuffer = false;
    for (let i = 0; i < this.sourceBuffer.buffered.length; i++) {
      if (
        currentTime > this.sourceBuffer.buffered.start(i) &&
        currentTime > this.sourceBuffer.buffered.end(i) - 5 &&
        !this.state.bufferReachedEnd &&
        !this.state.isBuffering &&
        !this.state.isSeeking
      ) {
        needsBuffer = true;
        break;
      }
    }

    if (needsBuffer) {
      this.setState({ isBuffering: true }, async () => {
        const buffer = await this.fetchSegment();
        this.handleAppendBuffer(buffer);
      });
    }

    const mins = Math.floor(currentTime / 60);
    const secs = Math.floor(currentTime % 60);
    const remainingTime = Math.floor(this.mediaSource.duration - currentTime || 0);

    this.setState({
      elapsedTime: `${mins}:${secs.toString(10).padStart(2, '0')}`,
      remainingTime: `-${remainingTime / 60}:${(remainingTime % 60).toString(10).padStart(2, '0')}`,
      percentComplete
    });
  };

  handleUpdateBuffer = () => {
    if (this.sourceBuffer.updating) return (this.shouldUpdateBuffer = true);
    const oldDuration = Number.isFinite(this.mediaSource.duration) ? this.mediaSource.duration : 0;
    const newDuration = this.trackDuration;

    if (newDuration < oldDuration) {
      this.sourceBuffer.remove(newDuration, oldDuration);
      this.shouldSetDuration = true;
      this.shouldUpdateBuffer = false;
      return;
    }

    this.mediaSource.duration = newDuration;
    this.shouldSetDuration = false;
    this.shouldUpdateBuffer = false;
  };

  handleUpdateDuration = () => {
    this.mediaSource.duration = this.trackDuration;
    this.shouldSetDuration = false;
  };

  handleAppendBuffer = buffer => {
    if (this.sourceBuffer.updating) return this.queue.push(buffer);
    this.sourceBuffer.appendBuffer(buffer);
  };

  handleTrackEnded = () => {
    const { trackList } = this.props.release;
    const trackIndex = trackList.findIndex(({ trackTitle }) => trackTitle === this.props.player.trackTitle);

    if (trackList[trackIndex + 1]) {
      const nextTrackId = trackList[trackIndex + 1]._id;
      return this.nextTrack(nextTrackId);
    }

    this.stopAudio();
  };

  fetchInitSegment = async () => {
    const { releaseId, trackId } = this.props.player;
    const res = await axios.get(`/api/${releaseId}/${trackId}/init`);
    this.segmentList = res.data.segmentList;
    const range = res.data.initRange;
    const initConfig = { headers: { Range: `bytes=${range}` }, responseType: 'arraybuffer' };
    const init = await axios.get(res.data.url, initConfig);
    this.initSegment = new Uint8Array(init.data);
    this.currentSegment = 0;
    this.trackDuration = res.data.duration;
    this.isNewTrack = false;
  };

  fetchSegment = async () => {
    const { releaseId, trackId } = this.props.player;
    const resUrl = await axios.get(`/api/${releaseId}/${trackId}/segment`);
    const segmentUrl = resUrl.data;
    const range = this.segmentList[this.currentSegment];
    const segmentConfig = { headers: { Range: `bytes=${range}` }, responseType: 'arraybuffer' };
    const res = await axios.get(segmentUrl, segmentConfig);
    const segment = new Uint8Array(res.data);
    const buffer = new Uint8Array([...this.initSegment, ...segment]);

    if (this.currentSegment < this.segmentList.length - 1) {
      this.currentSegment++;
    } else {
      this.setState({ bufferReachedEnd: true });
    }

    return buffer;
  };

  handlePause = () => {
    this.audioPlayerRef.current.pause();
    this.props.playerPause();
  };

  handlePlay = () => {
    const promisePlay = this.audioPlayerRef.current.play();

    if (promisePlay !== undefined) {
      promisePlay.then(this.props.playerPlay).catch(error => {
        this.setState({ autoStartDisabled: true });
        this.props.toastError(`Playback error: ${error.message}`);
      });
    }
  };

  handleSeek = event => {
    const x = event.clientX;
    const width = this.seekBarRef.current.clientWidth;
    const seekPercent = x / width;
    this.audioPlayerRef.current.currentTime = this.mediaSource.duration * seekPercent;
  };

  hidePlayer = () => {
    this.props.playerHide();
    this.stopAudio();
  };

  nextTrack = nextTrackId => {
    const nextTrack = this.props.release.trackList.find(({ _id }) => _id === nextTrackId);

    this.props.playTrack({
      releaseId: this.props.release._id,
      trackId: nextTrack._id,
      artistName: this.props.release.artistName,
      trackTitle: nextTrack.trackTitle
    });
  };

  playAudio = async () => {
    this.setState({ autoStartDisabled: false });
    if (this.props.player.isPlaying) return this.handlePause();
    this.handlePlay();
  };

  stopAudio = () => {
    this.setState({ bufferReachedEnd: false });
    this.audioPlayerRef.current.pause();
    this.audioPlayerRef.current.currentTime = 0;
    this.currentSegment = 0;
    this.props.playerStop();
  };

  render() {
    const { showPlayer } = this.props.player;
    const playerClassNames = classNames(styles.player, {
      [styles.show]: showPlayer
    });

    return (
      <div className={playerClassNames}>
        <audio id="player" ref={this.audioPlayerRef} />
        <div className={styles.seek} onClick={this.handleSeek} ref={this.seekBarRef} role="button" tabIndex="-1">
          <div className={styles.progress} style={{ width: `${this.state.percentComplete}%` }} />
        </div>
        <div className="container-fluid">
          <div className={`${styles.interface} row no-gutters`}>
            <div className={`${styles.controls} col-sm`}>
              <PlayButton isReady={this.state.isReady} playAudio={this.playAudio} />
              <FontAwesome name="stop" className={styles.playerButton} onClick={this.stopAudio} />
              <div
                className={`${styles.currentTime} align-middle`}
                onClick={() =>
                  this.setState({
                    showRemaining: !this.state.showRemaining
                  })
                }
                role="button"
                tabIndex="-1"
              >
                {this.state.showRemaining ? this.state.remainingTime : this.state.elapsedTime}
              </div>
            </div>
            <div className={`${styles.trackInfo} col-sm`}>
              <TrackInfo isReady={this.state.isReady} />
              <FontAwesome
                name="chevron-circle-down"
                className={`${styles.playerButton} ${styles.hide}`}
                onClick={this.hidePlayer}
                title="Hide player (will stop audio)"
              />
            </div>
          </div>
        </div>
      </div>
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
})(withRouter(Player));
