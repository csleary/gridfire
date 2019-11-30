import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { fetchCatalogue, fetchRelease, playTrack, toastInfo } from 'actions';
import { sortNumbers, sortStrings } from 'functions';
import FontAwesome from 'react-fontawesome';
import PropTypes from 'prop-types';
import RenderRelease from 'components/renderRelease';
import Spinner from 'components/spinner';
import { connect } from 'react-redux';
import styles from './home.module.css';

const Home = props => {
  const {
    catalogue,
    catalogueLimit,
    catalogueSkip,
    fetchCatalogue,
    fetchRelease,
    playTrack,
    reachedEndOfCat,
    toastInfo
  } = props;
  const { service } = props.match.params;

  const [isFetching, setFetching] = useState(false);
  const [isLoading, setLoading] = useState(true);
  const [sortBy] = useState([
    'Unsorted',
    'Release Date (new)',
    'Release Date (old)',
    'Artist Name',
    'Release Title',
    'Price (low)',
    'Price (high)'
  ]);
  const [sortCount, setSortCount] = useState(0);

  const handleFetchCatalogue = useCallback(
    isUpdate =>
      new Promise(resolve => {
        setFetching(true);
        fetchCatalogue(catalogueLimit, catalogueSkip).then(() => {
          setFetching(false);
        });
        resolve();
      }),
    [catalogueLimit, catalogueSkip, fetchCatalogue]
  );

  useEffect(() => {
    if (service) {
      const serviceName =
        service.charAt(0).toUpperCase() + service.substring(1);
      toastInfo(
        `Thank you. You are now logged in using your ${serviceName} account.`
      );
    }
  }, [service, toastInfo]);

  useEffect(() => {
    if (!catalogue.length) {
      handleFetchCatalogue().then(() => {
        setLoading(false);
      });
    } else {
      setLoading(false);
    }
  }, [catalogue.length, handleFetchCatalogue]);

  const handleSortClick = () => setSortCount(sortCount + 1);
  const handleClick = () => handleFetchCatalogue(true);
  const sortIndex = sortCount % sortBy.length;

  const handleSortCatalogue = useMemo(() => {
    const sortIndex = sortCount % sortBy.length;
    const unsorted = [...catalogue];

    switch (sortBy[sortIndex]) {
    case 'Release Date (new)':
      return sortNumbers(unsorted, 'releaseDate').reverse();
    case 'Release Date (old)':
      return sortNumbers(unsorted, 'releaseDate');
    case 'Artist Name':
      return sortStrings(unsorted, 'artistName');
    case 'Release Title':
      return sortStrings(unsorted, 'releaseTitle');
    case 'Price (low)':
      return sortNumbers(unsorted, 'price');
    case 'Price (high)':
      return sortNumbers(unsorted, 'price').reverse();
    default:
      return catalogue;
    }
  }, [catalogue, sortBy, sortCount]);

  const renderReleases = () =>
    handleSortCatalogue.map(release => (
      <RenderRelease
        fetchRelease={fetchRelease}
        key={release._id}
        playTrack={playTrack}
        release={release}
        toastInfo={toastInfo}
      />
    ));

  if (isLoading) {
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
            className={`btn btn-outline-primary btn-sm ${styles.sortButton} mb-3`}
            onClick={handleSortClick}
          >
            <FontAwesome name="sort" className="mr-2" />
            {sortBy[sortIndex]}
          </button>
          <div className={styles.frontPage}>{renderReleases()}</div>
          <div className="d-flex justify-content-center">
            <button
              className="btn btn-outline-primary btn-sm px-3 py-2 mt-3"
              disabled={isFetching || reachedEndOfCat}
              onClick={handleClick}
            >
              {reachedEndOfCat ? null : (
                <FontAwesome
                  name="refresh"
                  spin={isFetching}
                  className="mr-2"
                />
              )}
              {reachedEndOfCat ? 'No More Releases' : 'Load More'}
            </button>
          </div>
        </div>
      </div>
    </main>
  );
};

Home.propTypes = {
  catalogue: PropTypes.array,
  catalogueLimit: PropTypes.number,
  catalogueSkip: PropTypes.number,
  fetchCatalogue: PropTypes.func,
  fetchRelease: PropTypes.func,
  match: PropTypes.object,
  playTrack: PropTypes.func,
  service: PropTypes.string,
  reachedEndOfCat: PropTypes.bool,
  toastInfo: PropTypes.func
};

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
