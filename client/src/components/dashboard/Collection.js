import React, { Component } from 'react';
import { connect } from 'react-redux';
import RenderRelease from '../RenderRelease';
import Spinner from '../Spinner';
import {
  fetchCollection,
  fetchDownloadToken,
  fetchRelease,
  playTrack,
  toastMessage
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
        toastMessage={this.props.toastMessage}
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

    if (!this.props.collection.length) {
      return (
        <main className="container">
          <div className="row">
            <div className="col">
              <h3>The shelves are bare!</h3>
              <p>
                Once you&rsquo;ve purchased a release it will be added here,
                where you&rsquo;ll have easy access to your downloads.
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
    toastMessage
  }
)(Collection);
