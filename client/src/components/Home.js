import React, { Component } from 'react';
import { connect } from 'react-redux';
import FontAwesome from 'react-fontawesome';
import RenderRelease from './RenderRelease';
import Spinner from './Spinner';
import { fetchCatalogue, fetchRelease, playTrack, toastInfo } from '../actions';
import { sortNumbers, sortStrings } from '../functions';
import '../style/home.css';

class Home extends Component {
  constructor(props) {
    super(props);
    this.state = {
      isFetching: false,
      isLoading: true,
      isSorting: false,
      sortBy: [
        'Release Date (new)',
        'Release Date (old)',
        'Artist Name',
        'Release Title',
        'Price (low)',
        'Price (high)'
      ],
      sortCount: 0
    };
  }

  componentDidMount() {
    if (!this.props.catalogue.length) {
      this.handleFetchCatalogue().then(() => {
        this.handleLogInService();
        this.setState({ isLoading: false });
      });
    } else {
      this.handleLogInService();
      this.setState({ isLoading: false });
    }
  }

  handleLogInService = () => {
    let { service } = this.props.match.params;
    if (service) {
      service = service.charAt(0).toUpperCase() + service.substring(1);
      this.props.toastInfo(
        `Thank you. You are now logged in using your ${service} account.`
      );
    }
  };

  handleFetchCatalogue = isUpdate =>
    new Promise(resolve => {
      const { fetchInterval } = this.state;
      const { catalogueLimit, catalogueSkip } = this.props;
      this.setState({ isFetching: true });
      this.props
        .fetchCatalogue(catalogueLimit, catalogueSkip, fetchInterval)
        .then(() => {
          this.setState({ isFetching: false });
        });
      resolve();
    });

  handleSortCatalogue = () => {
    const { catalogue } = this.props;
    const sortIndex = this.state.sortCount % this.state.sortBy.length;

    switch (this.state.sortBy[sortIndex]) {
    case 'Release Date (new)':
      return sortNumbers(catalogue, 'releaseDate').reverse();
    case 'Release Date (old)':
      return sortNumbers(catalogue, 'releaseDate');
    case 'Artist Name':
      return sortStrings(catalogue, 'artistName');
    case 'Release Title':
      return sortStrings(catalogue, 'releaseTitle');
    case 'Price (low)':
      return sortNumbers(catalogue, 'price');
    case 'Price (high)':
      return sortNumbers(catalogue, 'price').reverse();
    default:
      return sortNumbers(catalogue, 'releaseDate').reverse();
    }
  };

  handleSortClick = () =>
    this.setState({ sortCount: this.state.sortCount + 1 });

  handleClick = () => this.handleFetchCatalogue(true);

  render() {
    const sortIndex = this.state.sortCount % this.state.sortBy.length;

    const renderReleases = this.handleSortCatalogue().map(release => (
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
            <button
              className="btn btn-outline-primary btn-sm sort-btn mb-3"
              disabled={this.state.isSorting}
              onClick={this.handleSortClick}
            >
              <FontAwesome name="sort" className="mr-2" />
              {this.state.sortBy[sortIndex]}
            </button>
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
    catalogueSkip: state.releases.catalogueSkip,
    catalogueLimit: state.releases.catalogueLimit,
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
