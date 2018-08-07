import React, { Component, Fragment } from 'react';
import FontAwesome from 'react-fontawesome';
import { connect } from 'react-redux';
import { Link, withRouter } from 'react-router-dom';
import classNames from 'classnames';
import moment from 'moment';
import uuidv4 from 'uuid/v4';
import {
  fetchRelease,
  fetchUser,
  fetchXemPrice,
  playerPause,
  playerPlay,
  playTrack,
  searchReleases,
  toastInfo
} from '../actions';
import CLOUD_URL from '../index';
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
      const { purchases } = this.props.user;
      if (!this.props.release) {
        this.props.history.push('/');
        return;
      }

      const tagLength = this.props.release.tags.length;
      const tagKeys = Array.from({ length: tagLength }, () => uuidv4());
      this.setState({ tagKeys });

      const inCollection =
        purchases &&
        purchases.some(
          currentRelease => currentRelease.releaseId === releaseId
        );

      if (inCollection) this.setState({ inCollection: true });
      this.setState({ isLoading: false });
    });
  }

  componentWillReceiveProps(nextProps) {
    if (
      nextProps.match.params.releaseId !== this.props.match.params.releaseId
    ) {
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
    this.props.toastInfo(`Loading '${trackTitle}'`);
  }

  handlePlayRelease() {
    const audioPlayer = document.getElementById('player');
    const { artistName, trackList } = this.props.release;
    const releaseId = this.props.release._id;
    const { isPlaying, isPaused } = this.props.player;
    const playerReleaseId = this.props.player.releaseId;

    if (isPlaying && playerReleaseId === releaseId) {
      audioPlayer.pause();
      this.props.playerPause();
    } else if (isPaused && playerReleaseId === releaseId) {
      audioPlayer.play();
      this.props.playerPlay();
    } else {
      this.props.playTrack(
        releaseId,
        trackList[0]._id,
        artistName,
        trackList[0].trackTitle
      );
      this.nowPlayingToast(trackList[0].trackTitle);
    }
  }

  handleTagSearch = tag => {
    this.props.searchReleases(tag).then(this.props.history.push('/search'));
  };

  renderTrackList = () =>
    this.props.release.trackList.map(track => {
      const { trackTitle } = track;
      const trackId = track._id;
      const { isPlaying, isPaused } = this.props.player;
      const playerTrackId = this.props.player.trackId;
      const { _id, artistName } = this.props.release;
      const releaseId = _id;

      const nowPlaying = () => {
        if (trackId !== playerTrackId) return;
        if (isPlaying) {
          return <FontAwesome className="now-playing" name="play" />;
        }
        if (isPaused) {
          return <FontAwesome className="now-playing" name="pause" />;
        }
      };

      return (
        <li key={trackId}>
          <a
            onClick={() => {
              this.props.playTrack(releaseId, trackId, artistName, trackTitle);
              this.nowPlayingToast(trackTitle);
            }}
            role="link"
            tabIndex="-1"
          >
            {trackTitle}
          </a>
          {nowPlaying()}
        </li>
      );
    });

  renderPrice() {
    const { release, xemPriceUsd } = this.props;
    const { price } = release;

    if (!price) return 'Name Your Price';

    if (xemPriceUsd) {
      const priceInXem = price / xemPriceUsd;
      return `${price} USD (~${priceInXem.toFixed(2)} XEM)`;
    }
  }

  renderPurchaseButton() {
    if (!this.props.release.price) {
      return (
        <Fragment>
          <FontAwesome name="qrcode" className="mr-2" />
          Name Your Price
        </Fragment>
      );
    }
    if (this.state.inCollection) {
      return (
        <Fragment>
          <FontAwesome name="check-circle" className="mr-2" />
          Transactions
        </Fragment>
      );
    }
    return (
      <Fragment>
        <FontAwesome name="qrcode" className="mr-2" />
        Purchase
      </Fragment>
    );
  }

  render() {
    if (this.state.isLoading) {
      return (
        <Spinner>
          <h2 className="mt-4">Loading release&hellip;</h2>
        </Spinner>
      );
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
      releaseDate,
      trackList,
      tags
    } = this.props.release;
    const releaseId = _id;
    const { isPlaying } = this.props.player;
    const playerReleaseId = this.props.player.releaseId;

    const trackListColumns = classNames('tracklist-wrapper', {
      columns: trackList.length > 10
    });

    const releaseTags =
      tags.length &&
      tags.map((tag, index) => (
        <div
          className="tag mr-2 mb-2"
          key={this.state.tagKeys[index]}
          onClick={() => this.handleTagSearch(tag)}
          role="button"
          tabIndex="-1"
          title={`Click to see more releases tagged with '${tag}'.`}
        >
          {tag}
        </div>
      ));

    return (
      <main className="container d-flex align-items-center">
        <div className="row selected-release">
          <div className="col-md-6 col-artwork p-3">
            <div className="artwork" onTouchStart={() => {}}>
              <img
                alt={releaseTitle}
                className="lazyload img-fluid"
                data-src={artwork ? `${CLOUD_URL}/${releaseId}.jpg` : null}
                src="data:image/gif;base64,R0lGODlhAQABAIAAAAUEBAAAACwAAAAAAQABAAACAkQBADs="
              />
              <div
                className="cover-artwork-overlay"
                onClick={() => this.handlePlayRelease()}
                role="button"
                tabIndex="-1"
                title={`${artistName} - ${releaseTitle}`}
              >
                {isPlaying && releaseId === playerReleaseId ? (
                  <FontAwesome className="" name="pause" />
                ) : (
                  <FontAwesome className="play" name="play" />
                )}
              </div>
            </div>
          </div>
          <div className="col-md-6 release-info p-3">
            <h2 className="release-title text-center ibm-type-italic">
              {releaseTitle}
              {this.state.inCollection && (
                <Fragment>
                  <div className="in-collection-corner" />
                  <Link to={'/dashboard/collection'}>
                    <FontAwesome
                      className="in-collection-check"
                      name="check"
                      title="This release is in your collection."
                    />
                  </Link>
                </Fragment>
              )}
            </h2>
            <h4 className="artist-name text-center">
              <Link to={`/artist/${artist}`}>{artistName}</Link>
            </h4>
            <h6 className="release-price text-center">{this.renderPrice()}</h6>
            <div className={trackListColumns}>
              <ol className="tracklist">{this.renderTrackList()}</ol>
            </div>
            <div className="d-flex justify-content-center">
              <Link
                to={`/payment/${releaseId}`}
                className="btn btn-outline-primary buy-button"
              >
                {this.renderPurchaseButton()}
              </Link>
            </div>
            <h6>
              <FontAwesome name="calendar-o" className="mr-2 red" />
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
                <h6 className="red mt-4">{info && 'Info'}</h6>
                <p className="info">{info}</p>
              </Fragment>
            )}
            {credits && (
              <Fragment>
                <h6 className="red mt-4">{credits && 'Credits'}</h6>
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
            {releaseTags.length && (
              <Fragment>
                <h6 className="red mt-4 mb-3">Tags</h6>
                <div className="tags">{releaseTags}</div>
              </Fragment>
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
    searchReleases,
    toastInfo
  }
)(withRouter(SelectedRelease));
