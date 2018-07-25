import React, { Component } from 'react';
import { connect } from 'react-redux';
import RenderRelease from '../RenderRelease';
import Spinner from '../Spinner';
import {
  fetchCollection,
  fetchDownloadToken,
  fetchRelease,
  playTrack,
  toastInfo
} from '../../actions';
import '../../style/home.css';

class Collection extends Component {
  constructor(props) {
    super(props);
    this.state = {
      isLoading: false
    };
  }

  componentDidMount() {
    this.setLoading();
    this.props
      .fetchCollection()
      .then(() => this.setState({ isLoading: false }));
  }

  setLoading() {
    this.setState({ isLoading: true });
  }

  render() {
    const { collection } = this.props;
    const renderReleases = collection.map(release => (
      <RenderRelease
        fetchDownloadToken={this.props.fetchDownloadToken}
        fetchRelease={this.props.fetchRelease}
        key={release._id}
        playTrack={this.props.playTrack}
        release={release}
        toastInfo={this.props.toastInfo}
        variation="collection"
      />
    ));

    if (this.state.isLoading) {
      return (
        <Spinner>
          <h2>Loading collection&hellip;</h2>
        </Spinner>
      );
    }

    if (!collection.length) {
      return (
        <main className="container">
          <div className="row">
            <div className="col">
              <h3 className="text-center mt-4">No releases found</h3>
              <p className="text-center">
                Once you&rsquo;ve purchased a release it will be added here to
                your collection, where you&rsquo;ll have easy access to release
                downloads.
              </p>
            </div>
          </div>
        </main>
      );
    }

    return (
      <main className="container-fluid">
        <div className="row">
          <div className="col">
            <h3 className="text-center">
              {collection.length} release{collection.length > 1 ? 's' : ''}{' '}
              currently in your collection
            </h3>
            <div className="front-page">{renderReleases}</div>
          </div>
        </div>
      </main>
    );
  }
}

function mapStateToProps(state) {
  return {
    collection: state.releases.collection
  };
}

export default connect(
  mapStateToProps,
  {
    fetchCollection,
    fetchDownloadToken,
    fetchRelease,
    playTrack,
    toastInfo
  }
)(Collection);
