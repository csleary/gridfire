import { Link, withRouter } from 'react-router-dom';
import React, { useEffect, useRef, useState } from 'react';
import { clearReleases, searchReleases } from '../actions';
import FontAwesome from 'react-fontawesome';
import classNames from 'classnames';
import { connect } from 'react-redux';
import debounce from 'lodash.debounce';
import styles from '../style/SearchBar.module.css';
import { usePrevious } from '../functions';

const SearchBar = props => {
  const { isSearching, searchResults } = props;
  const [expandSearch, setExpandSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const searchBar = useRef();

  const handleKeyDown = e => {
    if (e.keyCode === 27) {
      searchBar.current.blur();
      setExpandSearch(false);
    }
  };

  const handleSearch = debounce(
    () => {
      props.searchReleases(searchQuery);
    },
    250,
    { leading: false, trailing: true }
  );

  const previousQuery = usePrevious(searchQuery);

  useEffect(() => {
    if (searchQuery.length && searchQuery !== previousQuery) {
      handleSearch();
    }
  }, [handleSearch, previousQuery, searchQuery]);

  const handleSearchInput = e => {
    setSearchQuery(e.target.value);
  };

  const handleSearchBlur = () => {
    setSearchQuery('');
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
    setSearchQuery('');
    setExpandSearch(false);
  };

  const handleClearSearch = () => {
    props.clearReleases();
    searchBar.current.focus();
    setSearchQuery('');
  };

  const handleSubmit = e => {
    e.preventDefault();
    props.history.push('/search');
  };

  const previewClassNames = classNames(styles.preview, {
    [styles.showPreview]: expandSearch && searchResults.length
  });
  const clearSearchClassNames = classNames(styles.clear, {
    [styles.showClear]: searchQuery
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
          <ul className={styles.list}>
            {searchResults.length && (
              <p className={styles.p}>
                <small>
                  {searchResults.length} result
                  {searchResults.length === 1 ? '' : 's'} for &lsquo;
                  {searchQuery}&rsquo; (hit return for the{' '}
                  <Link to={'/search'}>full grid view</Link>):
                </small>
              </p>
            )}
            {resultsList}
          </ul>
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
          value={searchQuery}
        />
      </div>
    </form>
  );
};

function mapStateToProps(state) {
  return {
    isSearching: state.releases.isSearching,
    searchResults: state.releases.searchResults
  };
}

export default connect(
  mapStateToProps,
  { clearReleases, searchReleases }
)(withRouter(SearchBar));
