import { shallowEqual, useDispatch, useSelector } from 'react-redux';
import Button from 'components/button';
import React from 'react';
import RenderRelease from 'components/renderRelease';
import Spinner from 'components/spinner';
import { clearResults } from 'features/search';
import { frontPage } from 'pages/home/home.module.css';
import styles from './searchResults.module.css';

const SearchResults = () => {
  const dispatch = useDispatch();
  const { isSearching, searchQuery, searchResults } = useSelector(state => state.search, shallowEqual);
  const resultsNum = searchResults.length;
  const renderReleases = searchResults.map(release => <RenderRelease key={release._id} release={release} />);

  const renderSearchResults = () => {
    if (searchQuery.length) {
      return (
        <>
          <h3 className="text-center mt-4">
            {resultsNum ? resultsNum : 'No'} result{resultsNum === 1 ? '' : 's'} for &lsquo;
            {searchQuery}
            &rsquo;.
          </h3>
          <div className={frontPage}>{renderReleases}</div>
          {resultsNum ? (
            <Button className={styles.clear} icon="times" onClick={() => dispatch(clearResults())} size="small">
              Clear
            </Button>
          ) : null}
        </>
      );
    }

    return <h3 className="text-center mt-4">Search for releases by artist, titles and tags.</h3>;
  };

  if (isSearching) {
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

export default SearchResults;
