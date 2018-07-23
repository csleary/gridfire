import React, { Component, Fragment } from 'react';
import FontAwesome from 'react-fontawesome';
import { connect } from 'react-redux';
import { Link } from 'react-router-dom';
import moment from 'moment';
import {
  fetchRelease,
  fetchUser,
  fetchXemPrice,
  playerPause,
  playerPlay,
  playTrack,
  toastMessage
} from '../actions';
import Spinner from './Spinner';
import '../style/selectedRelease.css';

class SelectedRelease extends Component {
  constructor(props) {
    super(props);
    this.state = {
      isLoading: true,
      inCollection: false
    };
  }

  componentDidMount() {
    const { releaseId } = this.props.match.params;
    this.props.fetchUser();
    this.props.fetchXemPrice();
    this.props.fetchRelease(releaseId).then(() => {
      if (!this.props.release) {
        this.props.history.push('/');
      } else {
        this.setState({ isLoading: false });
      }

      const { purchases } = this.props.user;
      const inCollection =
        purchases && purchases.some(release => releaseId === release.releaseId);
      if (inCollection) this.setState({ inCollection: true });
    });
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.match.params !== this.props.match.params) {
      this.setState({ isLoading: true });
      const { releaseId } = nextProps.match.params;
      this.props
        .fetchRelease(releaseId)
        .then(() => this.setState({ isLoading: false }));
    }
  }

  setLoading() {
    this.setState({ isLoading: true });
  }

  formatDate(date) {
    return moment(new Date(date)).format('Do of MMM, YYYY');
  }

  nowPlayingToast(trackTitle) {
    this.props.toastMessage({
      alertClass: 'alert-info',
      message: `Loading '${trackTitle}'`
    });
  }

  handlePlayRelease() {
    const audioPlayer = document.getElementById('player');
    const { artistName, _id, trackList } = this.props.release;
    const { albumId, isPlaying, isPaused } = this.props.player;

    if (isPlaying && albumId === _id) {
      audioPlayer.pause();
      this.props.playerPause();
    } else if (isPaused && albumId === _id) {
      audioPlayer.play();
      this.props.playerPlay();
    } else {
      this.props.playTrack(
        _id,
        trackList[0]._id,
        artistName,
        trackList[0].trackTitle
      );
      this.nowPlayingToast(trackList[0].trackTitle);
    }
  }

  renderTrackList = () =>
    this.props.release.trackList.map(track => {
      const nowPlaying = () => {
        if (
          track.trackTitle === this.props.player.trackTitle &&
          this.props.player.isPlaying
        ) {
          return <FontAwesome className="now-playing" name="play" />;
        } else if (
          track.trackTitle === this.props.player.trackTitle &&
          this.props.player.isPaused
        ) {
          return <FontAwesome className="now-playing" name="pause" />;
        }
      };

      return (
        <li key={track._id}>
          <a
            onClick={() => {
              this.props.playTrack(
                this.props.release._id,
                track._id,
                this.props.release.artistName,
                track.trackTitle
              );
              this.nowPlayingToast(track.trackTitle);
            }}
            role="link"
            tabIndex="-1"
          >
            {track.trackTitle}
          </a>
          {nowPlaying()}
        </li>
      );
    });

  renderPrice() {
    const { release, xemPriceUsd } = this.props;
    const { price } = release;

    if (!price) {
      return 'Name Your Price';
    }

    if (xemPriceUsd) {
      const priceInXem = price / xemPriceUsd;
      return `${price} USD (~${priceInXem.toFixed(2)} XEM)`;
    }
  }

  renderPurchaseButton() {
    if (!this.props.release.price) return 'Name Your Price';
    if (this.state.inCollection) return 'Transactions';
    return 'Purchase';
  }

  render() {
    if (this.state.isLoading) {
      return <Spinner />;
    }

    const {
      _id,
      artist,
      artistName,
      artwork,
      catNumber,
      credits,
      cLine,
      info,
      pLine,
      recordLabel,
      releaseTitle,
      releaseDate
    } = this.props.release;
    const { albumId, isPlaying } = this.props.player;

    return (
      <main className="container d-flex align-items-center">
        <div className="row selected-release">
          <div className="col-md-6 col-artwork">
            <div className="artwork" onTouchStart={() => {}}>
              <img
                alt={releaseTitle}
                className="lazyload img-fluid"
                data-src={artwork}
              />
              <div
                className="cover-artwork-overlay"
                onClick={() => this.handlePlayRelease()}
                role="button"
                tabIndex="-1"
                title={`${artistName} - ${releaseTitle}`}
              >
                {isPlaying && _id === albumId ? (
                  <FontAwesome className="" name="pause" />
                ) : (
                  <FontAwesome className="play" name="play" />
                )}
              </div>
            </div>
          </div>
          <div className="col-md-6 release-info">
            <h2 className="release-title text-center ibm-type-italic">
              {releaseTitle}
              {this.state.inCollection && (
                <Link to={'/dashboard/collection'}>
                  <FontAwesome
                    className="in-collection icon-right yellow"
                    name="certificate"
                    title="This release is in your collection."
                  />
                </Link>
              )}
            </h2>
            <h4 className="artist-name text-center">
              <Link to={`/artist/${artist}`}>{artistName}</Link>
            </h4>
            <h6 className="release-price text-center">{this.renderPrice()}</h6>
            <div className="tracklist-wrapper">
              <ol className="tracklist">{this.renderTrackList()}</ol>
            </div>
            <div className="d-flex justify-content-center">
              <Link
                to={`/payment/${this.props.release._id}`}
                className="btn btn-outline-primary buy-button"
              >
                {this.renderPurchaseButton()}
              </Link>
            </div>
            <h6>
              <FontAwesome name="calendar-o" className="icon-left red" />
              {this.formatDate(releaseDate)}
            </h6>
            {recordLabel && (
              <h6>
                <span className="red">Label:</span> {recordLabel}
              </h6>
            )}
            {catNumber && (
              <h6>
                <span className="red">Cat.:</span> {catNumber}
              </h6>
            )}
            {info && (
              <Fragment>
                <h6 className="red">{info && 'Info'}</h6>
                <p className="info">{info}</p>
              </Fragment>
            )}
            {credits && (
              <Fragment>
                <h6 className="red">{credits && 'Credits'}</h6>
                <p className="credits">{credits}</p>
              </Fragment>
            )}
            {(cLine || pLine) && (
              <p className="copyright red">
                {cLine && (
                  <Fragment>
                    &copy; {cLine.year} {cLine.owner}
                  </Fragment>
                )}
                {cLine && pLine && <br />}
                {pLine && (
                  <Fragment>
                    &#8471; {pLine.year} {pLine.owner}
                  </Fragment>
                )}
              </p>
            )}
          </div>
        </div>
      </main>
    );
  }
}

function mapStateToProps(state) {
  return {
    player: state.player,
    release: state.releases.selectedRelease,
    user: state.user,
    xemPriceUsd: state.nem.xemPriceUsd
  };
}

export default connect(
  mapStateToProps,
  {
    fetchRelease,
    fetchUser,
    fetchXemPrice,
    playerPause,
    playerPlay,
    playTrack,
    toastMessage
  }
)(SelectedRelease);
