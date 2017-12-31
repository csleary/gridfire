import React, { Component } from 'react';
import FontAwesome from 'react-fontawesome';
import { connect } from 'react-redux';
import { Link } from 'react-router-dom';
import moment from 'moment';
import {
  fetchRelease,
  fetchXemPrice,
  playTrack,
  toastMessage
} from '../actions';
import Spinner from './Spinner';
import '../style/selectedRelease.css';

class SelectedRelease extends Component {
  constructor(props) {
    super(props);
    this.state = {
      isLoading: true
    };
  }

  componentDidMount() {
    const { id } = this.props.match.params;
    this.props.fetchXemPrice();
    this.props.fetchRelease(id).then(() => this.setState({ isLoading: false }));
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.match.params !== this.props.match.params) {
      this.setState({ isLoading: true });
      const { id } = nextProps.match.params;
      this.props
        .fetchRelease(id)
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

  renderTrackList = () =>
    this.props.release.trackList.map((track) => {
      const nowPlaying = () => {
        if (
          track.trackTitle === this.props.player.trackTitle &&
          this.props.player.isPlaying
        ) {
          return <FontAwesome className="now-playing" name="play" />;
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

  render() {
    if (this.state.isLoading) {
      return <Spinner />;
    }

    const {
      artistName,
      artwork,
      catNumber,
      _id,
      price,
      recordLabel,
      releaseTitle,
      releaseDate,
      trackList
    } = this.props.release;

    return (
      <main className="container">
        <div className="row selected-release">
          <div className="col-md">
            <div className="artwork">
              <img src={artwork} alt={releaseTitle} className="img-fluid" />
              <div
                className="cover-artwork-overlay"
                onClick={() => {
                  this.props.playTrack(
                    _id,
                    trackList[0]._id,
                    artistName,
                    trackList[0].trackTitle
                  );
                  this.nowPlayingToast(trackList[0].trackTitle);
                }}
                role="button"
                tabIndex="-1"
                title={`${artistName} - ${releaseTitle}`}
              >
                <FontAwesome className="play" name="play" />
              </div>
            </div>
          </div>
          <div className="col-md release-info">
            <h2 className="release-title text-center">{releaseTitle}</h2>
            <h4 className="artist-name text-center">{artistName}</h4>
            <h6 className="release-price text-center">
              {price} XEM{' '}
              {this.props.xemPriceUsd &&
                `(~$${(
                  this.props.release.price * this.props.xemPriceUsd
                ).toFixed(2)} USD)`}
            </h6>
            <div className="tracklist-wrapper">
              <ol className="tracklist">{this.renderTrackList()}</ol>
            </div>
            <h6>
              <FontAwesome name="calendar-o" className="icon-left" />
              {this.formatDate(releaseDate)}
            </h6>
            <h6>{recordLabel && `Label: ${recordLabel}`}</h6>
            <h6>{catNumber && `Cat.: ${catNumber}`}</h6>
            <div className="d-flex justify-content-center">
              <Link
                to={`/payment/${this.props.release._id}`}
                className="btn btn-outline-primary buy-button"
              >
                Purchase
              </Link>
            </div>
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
    xemPriceUsd: state.nem.xemPriceUsd
  };
}

export default connect(mapStateToProps, {
  fetchRelease,
  fetchXemPrice,
  playTrack,
  toastMessage
})(SelectedRelease);
