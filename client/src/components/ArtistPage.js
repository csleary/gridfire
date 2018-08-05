import React, { Component } from 'react';
import { connect } from 'react-redux';
import RenderRelease from './RenderRelease';
import Spinner from './Spinner';
import {
  fetchArtistCatalogue,
  fetchRelease,
  playTrack,
  toastInfo
} from '../actions';
import '../style/home.css';

class ArtistPage extends Component {
  constructor(props) {
    super(props);
    this.state = {
      isLoading: false
    };
  }

  componentDidMount() {
    const { artist } = this.props.match.params;
    this.setLoading();
    this.props
      .fetchArtistCatalogue(artist)
      .then(() => this.setState({ isLoading: false }));
  }

  setLoading() {
    this.setState({ isLoading: true });
  }

  render() {
    const { releases, name } = this.props.artist;
    const renderReleases =
      releases &&
      releases.map(release => (
        <RenderRelease
          fetchRelease={this.props.fetchRelease}
          key={release._id}
          playTrack={this.props.playTrack}
          release={release}
          toastInfo={this.props.toastInfo}
        />
      ));

    if (this.state.isLoading) {
      return (
        <Spinner>
          <h2 className="mt-4">Loading artist catalogue&hellip;</h2>
        </Spinner>
      );
    }
    return (
      <main className="container-fluid">
        <div className="row">
          <div className="col">
            <h2 className="artist-name text-center mt-4">{name}</h2>
            <h3>Releases</h3>
            <div className="front-page">{renderReleases}</div>
          </div>
        </div>
      </main>
    );
  }
}

function mapStateToProps(state) {
  return {
    artist: state.releases.artist
  };
}

export default connect(
  mapStateToProps,
  {
    fetchRelease,
    fetchArtistCatalogue,
    playTrack,
    toastInfo
  }
)(ArtistPage);
