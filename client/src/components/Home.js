import React, { Component } from 'react';
import { connect } from 'react-redux';
import FontAwesome from 'react-fontawesome';
import RenderRelease from './RenderRelease';
import Spinner from './Spinner';
import { fetchCatalogue, fetchRelease, playTrack, toastInfo } from '../actions';
import '../style/home.css';

class Home extends Component {
  constructor(props) {
    super(props);
    this.state = {
      isFetching: false,
      isLoading: true,
      fetchInterval: 12,
      skip: 0
    };
  }

  componentDidMount() {
    this.handleFetchCatalogue().then(() => {
      let { service } = this.props.match.params;
      if (service) {
        service = service.charAt(0).toUpperCase() + service.substring(1);
        this.props.toastInfo(
          `Thank you. You are now logged in using your ${service} account.`
        );
      }
      this.setState({ isLoading: false });
    });
  }

  handleFetchCatalogue = isUpdate =>
    new Promise(resolve => {
      const { fetchInterval } = this.state;
      this.setState({ isFetching: true });
      const skip = isUpdate ? this.state.skip + fetchInterval : null;
      this.props.fetchCatalogue(skip, fetchInterval).then(latest => {
        this.setState({ isFetching: false, skip });
      });
      resolve();
    });

  handleClick = () => this.handleFetchCatalogue(true);

  render() {
    const { catalogue } = this.props;

    const renderReleases = catalogue.map(release => (
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
          <h2 className="mt-4">Loading catalogue&hellip;</h2>
        </Spinner>
      );
    }

    return (
      <main className="container-fluid">
        <div className="row">
          <div className="col p-3">
            <div className="front-page">{renderReleases}</div>
            <div className="d-flex justify-content-center">
              <button
                className="btn btn-outline-primary btn-sm px-3 py-2 mt-3"
                disabled={this.state.isFetching || this.props.reachedEndOfCat}
                onClick={this.handleClick}
              >
                {this.props.reachedEndOfCat ? null : (
                  <FontAwesome
                    name="refresh"
                    spin={this.state.isFetching}
                    className="mr-2"
                  />
                )}
                {this.props.reachedEndOfCat ? 'No More Releases' : 'Load More'}
              </button>
            </div>
          </div>
        </div>
      </main>
    );
  }
}

function mapStateToProps(state) {
  return {
    catalogue: state.releases.catalogue,
    reachedEndOfCat: state.releases.reachedEndOfCat
  };
}

export default connect(
  mapStateToProps,
  {
    fetchCatalogue,
    fetchRelease,
    playTrack,
    toastInfo
  }
)(Home);
