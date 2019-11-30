import { Link, withRouter } from 'react-router-dom';
import React, { Component, createRef } from 'react';
import {
  playTrack,
  playerHide,
  playerPause,
  playerPlay,
  playerStop,
  toastError,
  toastInfo
} from 'actions';
import FontAwesome from 'react-fontawesome';
import PropTypes from 'prop-types';
import axios from 'axios';
import classNames from 'classnames';
import { connect } from 'react-redux';
import styles from './player.module.css';

class Player extends Component {
  constructor(props) {
    super(props);
    this.state = {
      autoStartDisabled: false,
      bufferEnd: false,
      duration: null,
      elapsedTime: '',
      isBuffering: false,
      isSeeking: false,
      shouldUpdateBuffer: false,
      shouldSetDuration: false,
      showRemaining: false
    };

    this.audioPlayer = createRef();
    this.seekBar = createRef();
    this.newTrack = false;
    this.seekPercent = null;
    this.queue = [];
  }

  componentDidMount() {
    const iPhone = navigator.userAgent.indexOf('iPhone') !== -1;
    const iPad = navigator.userAgent.indexOf('iPad') !== -1;

    if (iPhone || iPad) {
      this.props.toastInfo(
        'This app uses the Media Source Extensions API for audio playback, which is not currently supported on your device (iOS).'
      );
      return;
    }

    const mimeType = 'audio/mp4; codecs="mp4a.40.2"';
    const supported = MediaSource.isTypeSupported(mimeType);

    if (!supported) {
      this.props.toastError(
        'Unfortunately this device does not support the Media Source Extensions API for audio playback.'
      );
      return;
    }

    this.mediaSource = new MediaSource();
    const audioPlayer = this.audioPlayer.current;
    audioPlayer.src = URL.createObjectURL(this.mediaSource);
    this.mediaSource.addEventListener('sourceopen', () => {
      URL.revokeObjectURL(audioPlayer.src);
      this.sourceBuffer = this.mediaSource.addSourceBuffer(mimeType);

      this.sourceBuffer.addEventListener('updateend', () => {
        if (this.state.shouldUpdateBuffer) {
          this.handleUpdateBuffer();
        } else if (this.state.shouldSetDuration) {
          this.handleUpdateDuration();
        } else if (this.queue.length) {
          this.sourceBuffer.appendBuffer(this.queue.shift());
        }
        this.setState({
          isSeeking: false,
          isBuffering: false
        });
      });
    });

    audioPlayer.addEventListener('timeupdate', () => {
      const { currentTime } = audioPlayer;
      const mins = Math.floor(currentTime / 60);
      const secs = Math.floor(currentTime % 60);
      const percentComplete = (currentTime / this.mediaSource.duration) * 100;
      const remainingTime = this.mediaSource.duration - currentTime || 0;
      const minsLeft = Math.floor(remainingTime / 60);
      const secsLeft = Math.floor(remainingTime % 60);

      if (
        this.state.bufferEnd &&
        this.state.percentComplete === percentComplete
      ) {
        this.handleTrackEnded();
        return;
      }

      let needsBuffer = false;
      for (let i = 0; i < this.sourceBuffer.buffered.length; i++) {
        if (
          currentTime > this.sourceBuffer.buffered.start(i) &&
          currentTime < this.sourceBuffer.buffered.end(i) &&
          currentTime > this.sourceBuffer.buffered.end(i) - 5 &&
          !this.state.bufferEnd &&
          !this.state.isBuffering &&
          !this.state.isSeeking
        ) {
          needsBuffer = true;
          break;
        }
      }

      if (needsBuffer) {
        this.setState({ isBuffering: true }, () => {
          this.fetchAudioRange(buffer => {
            this.handleAppendBuffer(buffer);
          });
        });
      }

      this.setState({
        elapsedTime: `${mins}:${secs.toString(10).padStart(2, '0')}`,
        remainingTime: `-${minsLeft}:${secsLeft.toString(10).padStart(2, '0')}`,
        percentComplete
      });
    });

    audioPlayer.addEventListener('loadstart', () => {
      this.setState({ ready: false });
    });

    audioPlayer.addEventListener('canplay', () => {
      this.setState({ ready: true });
    });

    audioPlayer.addEventListener('play', () => {
      this.handlePlay();
    });

    audioPlayer.addEventListener('seeking', () => {
      const { currentTime } = audioPlayer;
      let isBuffered;
      for (let i = 0; i < this.sourceBuffer.buffered.length; i++) {
        if (
          currentTime >= this.sourceBuffer.buffered.start(i) &&
          currentTime < this.sourceBuffer.buffered.end(i)
        ) {
          isBuffered = true;
          break;
        }
        isBuffered = false;
      }

      if (!isBuffered && !this.newTrack) {
        this.setState({ bufferEnd: false });
        this.currentSegment = Math.floor(currentTime / 15);
        this.setState(
          { ready: false, isSeeking: true, isBuffering: true },
          () => {
            this.fetchAudioRange(buffer => {
              this.handleAppendBuffer(buffer);
            });
          }
        );
      }
    });
    audioPlayer.addEventListener('ended', () => this.handleTrackEnded());
  }

  componentDidUpdate(prevProps) {
    if (prevProps.player.trackId !== this.props.player.trackId) {
      this.audioPlayer.current.pause();
      this.queue.length = 0;
      this.newTrack = true;
      this.emptySourceBuffer();
      this.setState({ bufferEnd: false, percentComplete: 0, ready: false });
      this.fetchAudioRange(buffer => {
        this.audioPlayer.current.currentTime = 0;
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

  emptySourceBuffer() {
    if (this.mediaSource.duration) {
      this.sourceBuffer.remove(0, this.mediaSource.duration);
    }
  }

  handleUpdateBuffer() {
    if (this.sourceBuffer.updating) {
      this.setState({ shouldUpdateBuffer: true });
      return;
    }

    const oldDuration = Number.isFinite(this.mediaSource.duration)
      ? this.mediaSource.duration
      : 0;

    const newDuration = this.state.duration;

    if (newDuration < oldDuration) {
      this.sourceBuffer.remove(newDuration, oldDuration);
      this.setState({ shouldUpdateBuffer: false, shouldSetDuration: true });
    } else {
      this.mediaSource.duration = newDuration;
      this.setState({ shouldUpdateBuffer: false, shouldSetDuration: false });
    }
  }

  handleUpdateDuration() {
    this.mediaSource.duration = this.state.duration;
    this.setState({ shouldSetDuration: false });
  }

  handleAppendBuffer(buffer) {
    if (!this.sourceBuffer.updating) {
      this.sourceBuffer.appendBuffer(buffer);
    } else {
      this.queue.push(buffer);
    }
  }

  handleTrackEnded() {
    const trackIndex = this.props.release.trackList.findIndex(
      track => track.trackTitle === this.props.player.trackTitle
    );
    if (trackIndex + 1 < this.props.release.trackList.length) {
      this.nextTrack(trackIndex + 1);
    } else {
      this.stopAudio();
    }
  }

  fetchAudioRange = async callback => {
    if (this.newTrack) {
      this.fetchInitSegment().then(() => {
        this.handleSegmentRanges(buffer => callback(buffer));
      });
    } else {
      this.handleSegmentRanges(buffer => callback(buffer));
    }
  };

  fetchInitSegment = () =>
    new Promise(async resolve => {
      const { releaseId, trackId } = this.props.player;
      const res = await axios.get(`/api/${releaseId}/${trackId}/init`);
      this.segmentList = res.data.segmentList;
      const range = res.data.initRange;

      const initConfig = {
        headers: { Range: `bytes=${range}` },
        responseType: 'arraybuffer'
      };
      const init = await axios.get(res.data.url, initConfig);
      this.initSegment = new Uint8Array(init.data);
      this.currentSegment = 0;
      this.setState({ duration: res.data.duration });
      this.newTrack = false;
      resolve();
    });

  handleSegmentRanges = async callback => {
    const { releaseId, trackId } = this.props.player;
    const resUrl = await axios.get(`/api/${releaseId}/${trackId}/segment`);
    const segmentUrl = resUrl.data;
    const range = this.segmentList[this.currentSegment];

    const segmentConfig = {
      headers: { Range: `bytes=${range}` },
      responseType: 'arraybuffer'
    };

    const res = await axios.get(segmentUrl, segmentConfig);
    const segment = new Uint8Array(res.data);
    const buffer = new Uint8Array([...this.initSegment, ...segment]);

    if (this.currentSegment < this.segmentList.length - 1) {
      this.currentSegment++;
    } else {
      this.setState({ bufferEnd: true });
    }
    callback(buffer);
  };

  handlePause = () => {
    this.audioPlayer.current.pause();
    this.props.playerPause();
  };

  handlePlay = () => {
    const promisePlay = this.audioPlayer.current.play();

    if (promisePlay !== undefined) {
      promisePlay.then(this.props.playerPlay).catch(e => {
        this.setState({ autoStartDisabled: true });
        this.props.toastError(`Playback error: ${e.message}`);
      });
    }
  };

  handleSeek = event => {
    const x = event.clientX;
    const width = this.seekBar.current.clientWidth;
    this.seekPercent = x / width;
    this.audioPlayer.current.currentTime =
      this.mediaSource.duration * this.seekPercent;
  };

  hidePlayer = () => {
    this.props.playerHide();
    this.stopAudio();
  };

  nextTrack = index => {
    this.props.playTrack(
      this.props.release._id,
      this.props.release.trackList[index]._id,
      this.props.release.artistName,
      this.props.release.trackList[index].trackTitle
    );
  };

  playAudio = async () => {
    this.setState({ autoStartDisabled: false });
    if (this.props.player.isPlaying) {
      this.handlePause();
    } else {
      this.handlePlay();
    }
  };

  stopAudio = () => {
    this.setState({ bufferEnd: false });
    this.audioPlayer.current.pause();
    this.audioPlayer.current.currentTime = 0;
    this.currentSegment = 0;
    this.props.playerStop();
  };

  renderPlayButton = () => {
    if (!this.state.ready) {
      return (
        <FontAwesome
          name="cog"
          spin
          className={`${styles.playerButton} ${styles.waiting}`}
        />
      );
    }

    if (this.props.player.isPlaying) {
      return (
        <FontAwesome
          name="pause"
          className={styles.playerButton}
          onClick={this.playAudio}
        />
      );
    }

    return (
      <FontAwesome
        name="play"
        className={styles.playerButton}
        onClick={this.playAudio}
      />
    );
  };

  renderTrackInfo = () => {
    const { releaseId, artistName, trackTitle } = this.props.player;
    if (!this.state.ready) return <span>Loading&hellip;</span>;

    if (this.props.history.location.pathname !== `/release/${releaseId}`) {
      return (
        <Link to={`/release/${releaseId}`}>
          {artistName} &bull; <em>{trackTitle}</em>
        </Link>
      );
    }

    return (
      <span className={styles.noLink}>
        {artistName} &bull; <em>{trackTitle}</em>
      </span>
    );
  };

  render() {
    const { showPlayer } = this.props.player;
    const playerClassNames = classNames(styles.player, {
      [styles.show]: showPlayer
    });

    return (
      <div className={playerClassNames}>
        <audio id="player" ref={this.audioPlayer} />
        <div
          className={styles.seek}
          onClick={this.handleSeek}
          ref={this.seekBar}
          role="button"
          tabIndex="-1"
        >
          <div
            className={styles.progress}
            style={{ width: `${this.state.percentComplete}%` }}
          />
        </div>
        <div className="container-fluid">
          <div className={`${styles.interface} row no-gutters`}>
            <div className={`${styles.controls} col-sm`}>
              {this.renderPlayButton()}
              <FontAwesome
                name="stop"
                className={styles.playerButton}
                onClick={this.stopAudio}
              />
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
                {this.state.showRemaining
                  ? this.state.remainingTime
                  : this.state.elapsedTime}
              </div>
            </div>
            <div className={`${styles.trackInfo} col-sm`}>
              {this.renderTrackInfo()}
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
  toastInfo: PropTypes.func
};

function mapStateToProps(state) {
  return {
    player: state.player,
    release: state.releases.selectedRelease
  };
}

export default connect(
  mapStateToProps,
  {
    playTrack,
    playerHide,
    playerPause,
    playerPlay,
    playerStop,
    toastError,
    toastInfo
  }
)(withRouter(Player));
