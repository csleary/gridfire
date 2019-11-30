import { clearResults, fetchRelease, playTrack, toastInfo } from '../actions';
import FontAwesome from 'react-fontawesome';
import PropTypes from 'prop-types';
import React from 'react';
import RenderRelease from './RenderRelease';
import Spinner from './Spinner';
import { connect } from 'react-redux';
import { frontPage } from 'style/Home.module.css';

const SearchResults = props => {
  const { searchQuery, searchResults } = props;
  const resultsNum = searchResults.length;

  const renderReleases = searchResults.map(release => (
    <RenderRelease
      fetchRelease={props.fetchRelease}
      key={release._id}
      playTrack={props.playTrack}
      release={release}
      toastInfo={props.toastInfo}
    />
  ));

  const renderSearchResults = () => {
    if (searchQuery.length) {
      return (
        <>
          <h3 className="text-center mt-4">
            {resultsNum ? resultsNum : 'No'} result{resultsNum === 1 ? '' : 's'}{' '}
            for &lsquo;
            {searchQuery}
            &rsquo;.
          </h3>
          <div className={frontPage}>{renderReleases}</div>
          {resultsNum ? (
            <button
              className="btn btn-outline-primary btn-sm px-3 py-2 mt-3"
              onClick={props.clearResults}
            >
              <FontAwesome className="mr-2" name="times" />
              Clear
            </button>
          ) : null}
        </>
      );
    }

    return (
      <h3 className="text-center mt-4">
        Search for releases by artist, titles and tags.
      </h3>
    );
  };

  if (props.isSearching) {
    return (
      <Spinner>
        <h3 className="mt-4">Searching for &lsquo;{searchQuery}&rsquo;…</h3>
      </Spinner>
    );
  }

  return (
    <main className="container-fluid">
      <div className="row">
        <div className="col py-3">{renderSearchResults()}</div>
      </div>
    </main>
  );
};

SearchResults.propTypes = {
  clearResults: PropTypes.func,
  fetchRelease: PropTypes.func,
  isSearching: PropTypes.bool,
  playTrack: PropTypes.func,
  searchQuery: PropTypes.string,
  searchResults: PropTypes.array,
  toastInfo: PropTypes.func
};

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
    clearResults,
    fetchRelease,
    playTrack,
    toastInfo
  }
)(SearchResults);
