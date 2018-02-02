import React, { Component } from 'react';
import { connect } from 'react-redux';
import { Link } from 'react-router-dom';
import FontAwesome from 'react-fontawesome';
import Spinner from './Spinner';
import {
  fetchCatalogue,
  fetchRelease,
  playTrack,
  toastMessage
} from '../actions';
import '../style/home.css';

class Home extends Component {
  constructor(props) {
    super(props);
    this.state = {
      isLoading: false
    };
  }

  componentDidMount() {
    this.setLoading();
    this.props.fetchCatalogue().then(() => this.setState({ isLoading: false }));
  }

  setLoading() {
    this.setState({ isLoading: true });
  }

  renderReleases() {
    const { catalogue } = this.props;

    return catalogue.map(release => (
      <div className="cover-artwork" key={release._id} onTouchStart={() => {}}>
        <img
          alt={`${release.artistName} - ${release.releaseTitle}`}
          className="lazyload artwork"
          data-src={release.artwork ? release.artwork : null}
        />
        <div
          className="cover-artwork-overlay"
          title={`${release.artistName} - ${release.releaseTitle}`}
        >
          <div className="artist-name">{release.artistName}</div>
          <div className="buttons">
            <FontAwesome
              className="play"
              name="play"
              onClick={() => {
                this.props.playTrack(
                  release._id,
                  release.trackList[0]._id,
                  release.artistName,
                  release.trackList[0].trackTitle
                );
                this.props.fetchRelease(release._id);
                this.props.toastMessage({
                  alertClass: 'alert-info',
                  message: `Loading ${release.artistName} - '${
                    release.trackList[0].trackTitle
                  }'`
                });
              }}
            />
            <Link to={`/release/${release._id}`}>
              <FontAwesome className="info" name="info-circle" />
            </Link>
          </div>
          <div className="release-title">
            <Link to={`/release/${release._id}`}>{release.releaseTitle}</Link>
          </div>
        </div>
      </div>
    ));
  }

  render() {
    if (this.state.isLoading) {
      return <Spinner message={<h2>Loading catalogue&hellip;</h2>} />;
    }
    return (
      <main className="container-fluid">
        <div className="row">
          <div className="col">
            <h2 className="text-center">
              Sell Your Music with the NEM Blockchain
            </h2>
            <div className="front-page">{this.renderReleases()}</div>
          </div>
        </div>
      </main>
    );
  }
}

function mapStateToProps(state) {
  return {
    catalogue: state.releases.catalogue
  };
}

export default connect(mapStateToProps, {
  fetchCatalogue,
  fetchRelease,
  playTrack,
  toastMessage
})(Home);
