import React, { Component, Fragment } from 'react';
import { connect } from 'react-redux';
import RenderRelease from './RenderRelease';
import Spinner from './Spinner';
import { fetchRelease, playTrack, toastInfo } from '../actions';
import '../style/home.css';

class SearchResults extends Component {
  constructor(props) {
    super(props);
    this.state = {
      isLoading: false
    };
  }

  componentDidMount() {}

  setLoading() {
    this.setState({ isLoading: true });
  }

  renderSearchResults() {
    const { searchQuery, searchResults } = this.props;
    const number = searchResults.length;

    const renderReleases = searchResults.map(release => (
      <RenderRelease
        fetchRelease={this.props.fetchRelease}
        key={release._id}
        playTrack={this.props.playTrack}
        release={release}
        toastInfo={this.props.toastInfo}
      />
    ));

    if (searchQuery.length) {
      return (
        <Fragment>
          <h3 className="text-center mt-4">
            {number} result{number === 1 ? '' : 's'} for &lsquo;{searchQuery}&rsquo;.
          </h3>
          <div className="front-page">{renderReleases}</div>
        </Fragment>
      );
    }

    return (
      <h3 className="text-center mt-4">
        Search for releases by artist, titles and tags.
      </h3>
    );
  }

  render() {
    const { searchQuery } = this.props;

    if (this.props.isSearching) {
      return (
        <Spinner>
          <h3 className="mt-4">Searching for &lsquo;{searchQuery}&rsquo;…</h3>
        </Spinner>
      );
    }

    return (
      <main className="container-fluid">
        <div className="row">
          <div className="col py-3">{this.renderSearchResults()}</div>
        </div>
      </main>
    );
  }
}

function mapStateToProps(state) {
  return {
    isSearching: state.releases.isSearching,
    searchQuery: state.releases.searchQuery,
    searchResults: state.releases.searchResults
  };
}

export default connect(
  mapStateToProps,
  {
    fetchRelease,
    playTrack,
    toastInfo
  }
)(SearchResults);
