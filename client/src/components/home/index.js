import React, { useCallback, useEffect, useRef, useState } from 'react';
import { fetchCatalogue, fetchRelease, playTrack, toastInfo } from 'actions';
import { useDispatch, useSelector } from 'react-redux';
import FontAwesome from 'react-fontawesome';
import PropTypes from 'prop-types';
import RenderRelease from 'components/renderRelease';
import Spinner from 'components/spinner';
import styles from './home.module.css';
import { useOnClickOutside } from 'hooks/useOnClickOutside';

const sortOptions = [
  { title: 'Date Added', sortPath: 'dateCreated', '1': 'Old', '-1': 'New' },
  {
    title: 'Release Date',
    sortPath: 'releaseDate',
    '1': 'Old',
    '-1': 'New'
  },
  {
    title: 'Artist Name',
    sortPath: 'artistName',
    '1': 'A\u2013Z',
    '-1': 'Z\u2013A'
  },
  {
    title: 'Release Title',
    sortPath: 'releaseTitle',
    '1': 'A\u2013Z',
    '-1': 'Z\u2013A'
  },
  { title: 'Price', sortPath: 'price', '-1': 'Desc.', '1': 'Asc.' }
];

const Home = props => {
  const { service } = props.match.params;
  const {
    catalogue,
    catalogueLimit,
    catalogueSkip,
    reachedEndOfCat
  } = useSelector(state => state.releases);

  const dispatch = useDispatch();
  const sortRef = useRef();
  const [showSortMenu, setShowSortMenu] = useState(false);
  useOnClickOutside(sortRef, () => setShowSortMenu(false));
  const [isFetching, setFetching] = useState(false);
  const [isSorting, setSorting] = useState(false);
  const [isLoading, setLoading] = useState(true);
  const [sortPath, setSortPath] = useState('dateCreated');
  const [sortOrder, setSortOrder] = useState(-1);

  const handleFetchCatalogue = useCallback(
    async (path, order) => {
      console.log(path, order);

      setFetching(true);
      await dispatch(
        fetchCatalogue(catalogueLimit, catalogueSkip, path, order)
      );
      setFetching(false);
    },
    [catalogueLimit, catalogueSkip, dispatch, sortPath, sortOrder]
  );

  useEffect(() => {
    if (!catalogue.length) {
      handleFetchCatalogue(sortPath, sortOrder).then(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [catalogue.length, handleFetchCatalogue]);

  useEffect(() => {
    if (service) {
      const serviceName =
        service.charAt(0).toUpperCase() + service.substring(1);
      dispatch(
        toastInfo(
          `Thank you. You are now logged in using your ${serviceName} account.`
        )
      );
    }
  }, [dispatch, service]);

  const handleSortPath = async path => {
    setSorting(true);
    setShowSortMenu(false);
    await handleFetchCatalogue(path, sortOrder);
    setSortPath(path);
    setSorting(false);
  };

  const handleSortOrder = async order => {
    setSorting(true);
    await handleFetchCatalogue(sortPath, order);
    setSortOrder(order);
    setSorting(false);
  };

  const renderSortMenu = () => {
    if (!showSortMenu) return null;

    return sortOptions.map(option => (
      <li
        className={styles.sortItem}
        key={option.title}
        onClick={() => handleSortPath(option.sortPath)}
      >
        {option.title}
      </li>
    ));
  };

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
          <div className={styles.sort} ref={sortRef}>
            <div className={styles.buttons}>
              <button
                className={`btn btn-outline-primary btn-sm ${styles.sortButton}`}
                disabled={isSorting}
                onClick={() => setShowSortMenu(!showSortMenu)}
              >
                <FontAwesome name="sort" className="mr-2" />
                {sortOptions.find(option => option.sortPath === sortPath).title}
              </button>
              <button
                className={`btn btn-outline-primary btn-sm ${styles.sortButton}`}
                disabled={isSorting}
                onClick={() => handleSortOrder(sortOrder * -1)}
              >
                {`(${
                  sortOptions.find(option => option.sortPath === sortPath)[
                    sortOrder.toString()
                  ]
                })`}
              </button>
              {isSorting ? (
                <FontAwesome className="ml-2" name="cog" spin />
              ) : null}
            </div>
            <ul className={styles.sortList}>{renderSortMenu()}</ul>
          </div>
          <div className={styles.frontPage}>
            {catalogue.map(release => (
              <RenderRelease
                fetchRelease={fetchRelease}
                key={release._id}
                playTrack={playTrack}
                release={release}
                toastInfo={toastInfo}
              />
            ))}
          </div>
          <div className="d-flex justify-content-center">
            <button
              className="btn btn-outline-primary btn-sm px-3 py-2 mt-3"
              disabled={isFetching || reachedEndOfCat}
              onClick={handleFetchCatalogue}
            >
              {reachedEndOfCat ? null : (
                <FontAwesome
                  name="refresh"
                  spin={isFetching}
                  className="mr-2"
                />
              )}
              {reachedEndOfCat ? null : 'Load More'}
            </button>
          </div>
        </div>
      </div>
    </main>
  );
};

Home.propTypes = {
  match: PropTypes.object,
  service: PropTypes.string
};

export default Home;
