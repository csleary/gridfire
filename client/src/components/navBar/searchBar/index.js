import { Link, withRouter } from 'react-router-dom';
import React, { useEffect, useRef, useState } from 'react';
import { clearResults, searchReleases } from 'actions';
import FontAwesome from 'react-fontawesome';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { connect } from 'react-redux';
import debounce from 'lodash.debounce';
import styles from './searchBar.module.css';
import { usePrevious } from 'functions';

const handleSearch = debounce((searchReleases, localSearchQuery) => {
  searchReleases(localSearchQuery);
}, 500);

const SearchBar = props => {
  const {
    clearResults,
    isSearching,
    globalSearchQuery,
    searchReleases,
    searchResults
  } = props;
  const [expandSearch, setExpandSearch] = useState(false);
  const [localSearchQuery, setLocalSearchQuery] = useState('');
  const searchBar = useRef();

  const handleKeyDown = e => {
    if (e.keyCode === 27) {
      searchBar.current.blur();
      setExpandSearch(false);
    }
  };

  const previousQuery = usePrevious(localSearchQuery);

  useEffect(() => {
    if (localSearchQuery.length && localSearchQuery !== previousQuery) {
      handleSearch(searchReleases, localSearchQuery);
      return;
    }
  }, [previousQuery, localSearchQuery, searchReleases]);

  const handleSearchInput = e => {
    setLocalSearchQuery(e.target.value);
  };

  const handleSearchBlur = () => {
    clearResults();
    setLocalSearchQuery('');
    setExpandSearch(false);
  };

  const handleSearchFocus = () => {
    searchBar.current.focus();
    setExpandSearch(true);
  };

  const handlePreviewClick = () => {
    setExpandSearch(true);
  };

  const handlePreviewBlur = () => {
    setLocalSearchQuery('');
    setExpandSearch(false);
  };

  const handleClearSearch = () => {
    searchBar.current.focus();
    setLocalSearchQuery('');
  };

  const handleSubmit = e => {
    e.preventDefault();
    props.history.push('/search');
  };

  const previewClassNames = classNames(styles.preview, {
    [styles.showPreview]: localSearchQuery.length && expandSearch
  });
  const clearSearchClassNames = classNames(styles.clear, {
    [styles.showClear]: localSearchQuery
  });
  const searchBarClassNames = classNames(styles.search, {
    [styles.expanded]: expandSearch
  });

  const resultsList = searchResults.map(release => (
    <Link
      className={`${styles.item} ${styles.action}`}
      key={release._id}
      to={`/release/${release._id}`}
    >
      {release.artistName} &bull; {release.releaseTitle}
    </Link>
  ));

  const renderResults = () => {
    if (props.location.pathname === '/search') return;

    if (searchResults.length) {
      return (
        <>
          <p className={styles.p}>
            <small>
              {searchResults.length} result
              {searchResults.length === 1 ? '' : 's'} for &lsquo;
              {globalSearchQuery}&rsquo; (hit return for the{' '}
              <Link to={'/search'}>full grid view</Link>):
            </small>
          </p>
          {resultsList}
        </>
      );
    }

    if (globalSearchQuery && !searchResults.length) {
      return (
        <p className={styles.p}>
          <small>
            Nothing found for &lsquo;{globalSearchQuery}
            &rsquo;.
          </small>
        </p>
      );
    }
  };

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <div className={styles.formGroup}>
        <div
          className={previewClassNames}
          onBlur={handlePreviewBlur}
          onClick={handlePreviewClick}
          onMouseDown={e => e.preventDefault()}
          onMouseUp={handlePreviewClick}
          role="button"
          tabIndex="-1"
        >
          <ul className={styles.list}>{renderResults()}</ul>
        </div>
        <FontAwesome
          className={styles.icon}
          onClick={handleSearchFocus}
          onMouseDown={e => e.preventDefault()}
          onMouseUp={handleSearchFocus}
          onTouchStart={handleSearchFocus}
          name="search"
          title="Search all available releases."
        />
        <FontAwesome
          className={clearSearchClassNames}
          onClick={handleClearSearch}
          onMouseDown={e => e.preventDefault()}
          onMouseUp={handleClearSearch}
          name={isSearching ? 'circle-o-notch' : 'times'}
          spin={isSearching}
        />
        <input
          className={searchBarClassNames}
          onBlur={handleSearchBlur}
          onChange={handleSearchInput}
          onFocus={handleSearchFocus}
          onKeyDown={handleKeyDown}
          placeholder={expandSearch ? 'Search…' : undefined}
          ref={searchBar}
          tabIndex="-1"
          type="text"
          value={localSearchQuery}
        />
      </div>
    </form>
  );
};

SearchBar.propTypes = {
  clearResults: PropTypes.func,
  globalSearchQuery: PropTypes.string,
  history: PropTypes.object,
  isSearching: PropTypes.bool,
  location: PropTypes.object,
  searchReleases: PropTypes.func,
  searchResults: PropTypes.array
};

function mapStateToProps(state) {
  return {
    isSearching: state.releases.isSearching,
    globalSearchQuery: state.releases.searchQuery,
    searchResults: state.releases.searchResults
  };
}

export default connect(
  mapStateToProps,
  { clearResults, searchReleases }
)(withRouter(SearchBar));
