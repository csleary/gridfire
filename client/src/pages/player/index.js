import React, { Component, createRef } from 'react';
import { faChevronDown, faStop } from '@fortawesome/free-solid-svg-icons';
import { playTrack, playerHide, playerPause, playerPlay, playerStop } from 'features/player';
import { toastError, toastInfo, toastWarning } from 'features/toast';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
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
      bufferRanges: [],
      bufferReachedEnd: false,
      elapsedTime: '',
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
    const iPhone = navigator.userAgent.indexOf('iPhone') !== -1;
    const iPad = navigator.userAgent.indexOf('iPad') !== -1;
    const isSupported = MediaSource.isTypeSupported(MIME_TYPE);

    if (iPhone || iPad || !isSupported) {
      return this.props.toastWarning(
        'The mp4 audio format we use is not currently supported by your device. Streaming will be disabled.'
      );
    }

    const audioPlayer = this.audioPlayerRef.current;
    const supportsHls =
      audioPlayer.canPlayType('application/vnd.apple.mpegURL') || audioPlayer.canPlayType('application/x-mpegURL');

    if (supportsHls === 'probably' || supportsHls === 'maybe') {
      // console.log('Using HLS.');
    }

    this.mediaSource = new MediaSource();
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

      if (this.mediaSource.duration && !this.sourceBuffer.updating) {
        this.sourceBuffer.remove(0, this.mediaSource.duration);
      }

      this.setState({ isBuffering: true, bufferReachedEnd: false, percentComplete: 0, isReady: false }, async () => {
        await this.fetchInitSegment();
        const buffer = await this.fetchSegment(0, 0);
        this.audioPlayerRef.current.currentTime = 0;
        this.handleUpdateBuffer();
        this.handleAppendBuffer(buffer);
        this.handlePlay();
      });
    }
  }

  componentWillUnmount() {
    if (!this.sourceBuffer.updating && this.mediaSource.readyState === 'open') {
      this.mediaSource.endOfStream();
    }
  }

  handleSourceOpen = () => {
    const audioPlayer = this.audioPlayerRef.current;
    URL.revokeObjectURL(audioPlayer.src);
    this.sourceBuffer = this.mediaSource.addSourceBuffer(MIME_TYPE);
    this.sourceBuffer.addEventListener('updateend', this.handleUpdateEnd);
  };

  handleUpdateEnd = e => {
    const { buffered } = e.target;
    const bufferRanges = [];

    for (let i = 0; i < buffered.length; i++) {
      bufferRanges.push([buffered.start(i), buffered.end(i)]);
    }

    if (this.shouldSetDuration) return this.handleUpdateDuration();
    if (this.queue.length) return this.sourceBuffer.appendBuffer(this.queue.shift());
    this.setState({ bufferRanges, isBuffering: false });
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
        this.handleAppendBuffer(buffer);
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
        this.handleAppendBuffer(buffer);
      });
    }

    const mins = Math.floor(currentTime / 60);
    const secs = Math.floor(currentTime % 60);
    const remainingTime = Math.floor(this.mediaSource.duration - currentTime || 0);
    const remainingMins = Math.floor(remainingTime / 60);
    const remainingSecs = (remainingTime % 60).toString(10).padStart(2, '0');

    this.setState({
      elapsedTime: `${mins}:${secs.toString(10).padStart(2, '0')}`,
      remainingTime: `-${remainingMins}:${remainingSecs}`,
      percentComplete
    });
  };

  handleUpdateBuffer = () => {
    const oldDuration = Number.isFinite(this.mediaSource.duration) ? this.mediaSource.duration : 0;
    if (this.trackDuration < oldDuration) {
      this.sourceBuffer.remove(this.trackDuration, oldDuration);
      this.shouldSetDuration = true;
    } else {
      this.mediaSource.duration = this.trackDuration;
    }

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
    const resUrl = await axios.get(`/api/${releaseId}/${trackId}/init`);
    const { duration, url, range } = resUrl.data;
    const config = { headers: { Range: `bytes=${range}` }, responseType: 'arraybuffer' };
    const resBuffer = await axios.get(url, config);
    this.initSegment = new Uint8Array(resBuffer.data);
    this.trackDuration = duration;
  };

  fetchSegment = async (time, type) => {
    const { releaseId, trackId } = this.props.player;
    const resUrl = await axios.get(`/api/${releaseId}/${trackId}/stream`, { params: { time, type } });
    const { url, range, end } = resUrl.data;
    const config = { headers: { Range: `bytes=${range}` }, responseType: 'arraybuffer' };
    const resBuffer = await axios.get(url, config);
    const segment = new Uint8Array(resBuffer.data);
    const buffer = new Uint8Array([...this.initSegment, ...segment]);
    if (end) this.setState({ bufferReachedEnd: true });
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
    this.audioPlayerRef.current.pause();
    this.audioPlayerRef.current.currentTime = 0;
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
          {this.state.bufferRanges.map(([start, end]) => {
            const left = (start / this.mediaSource.duration) * 100;
            const width = ((end - start) / this.mediaSource.duration) * 100;
            return <div className={styles.buffered} key={start} style={{ left: `${left}%`, width: `${width}%` }}></div>;
          })}
          <div className={styles.progress} style={{ width: `${this.state.percentComplete * 100}%` }} />
        </div>
        <div className="container-fluid">
          <div className={`${styles.interface} row no-gutters`}>
            <div className={`${styles.controls} col-sm`}>
              <PlayButton isReady={this.state.isReady} playAudio={this.playAudio} />
              <FontAwesomeIcon icon={faStop} className={styles.playerButton} onClick={this.stopAudio} />
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
              <FontAwesomeIcon
                icon={faChevronDown}
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
