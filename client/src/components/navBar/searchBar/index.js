import { Link, useHistory, useLocation } from 'react-router-dom';
import React, { useEffect, useRef, useState } from 'react';
import { clearResults, searchReleases } from 'features/search';
import { shallowEqual, useDispatch, useSelector } from 'react-redux';
import FontAwesome from 'react-fontawesome';
import classNames from 'classnames';
import debounce from 'lodash.debounce';
import styles from './searchBar.module.css';
import { usePrevious } from 'functions';

const handleSearch = debounce((dispatch, searchText) => {
  dispatch(searchReleases(searchText));
}, 500);

const SearchBar = () => {
  const dispatch = useDispatch();
  const history = useHistory();
  const location = useLocation();
  const { isSearching, searchQuery, searchResults } = useSelector(state => state.search, shallowEqual);
  const [expandSearch, setExpandSearch] = useState(false);
  const [searchText, setSearchText] = useState('');
  const searchBar = useRef();

  const handleKeyDown = e => {
    if (e.keyCode === 27) {
      searchBar.current.blur();
      setExpandSearch(false);
    }
  };

  const previousQuery = usePrevious(searchText);

  useEffect(() => {
    if (searchText.length && searchText !== previousQuery) {
      handleSearch(dispatch, searchText);
    }
  }, [dispatch, previousQuery, searchText]);

  const handleSearchInput = e => {
    setSearchText(e.target.value);
  };

  const handleSearchBlur = () => {
    setSearchText('');
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
    setSearchText('');
    setExpandSearch(false);
  };

  const handleClearSearch = () => {
    dispatch(clearResults());
    searchBar.current.focus();
    setSearchText('');
  };

  const handleSubmit = e => {
    e.preventDefault();
    history.push('/search');
  };

  const previewClassNames = classNames(styles.preview, {
    [styles.showPreview]: searchText.length && expandSearch
  });
  const clearSearchClassNames = classNames(styles.clear, {
    [styles.showClear]: searchText
  });
  const searchBarClassNames = classNames(styles.search, {
    [styles.expanded]: expandSearch
  });

  const resultsList = searchResults.map(release => (
    <Link className={`${styles.item} ${styles.action}`} key={release._id} to={`/release/${release._id}`}>
      {release.artistName} &bull; {release.releaseTitle}
    </Link>
  ));

  const renderResults = () => {
    if (location.pathname === '/search') return;

    if (searchResults.length) {
      return (
        <>
          <p className={styles.p}>
            <small>
              {searchResults.length} result
              {searchResults.length === 1 ? '' : 's'} for &lsquo;
              {searchQuery}&rsquo; (hit return for the <Link to={'/search'}>full grid view</Link>):
            </small>
          </p>
          {resultsList}
        </>
      );
    }

    if (searchQuery && !searchResults.length) {
      return (
        <p className={styles.p}>
          <small>
            Nothing found for &lsquo;{searchQuery}
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
          value={searchText}
        />
      </div>
    </form>
  );
};

export default SearchBar;
