import React, { useCallback, useEffect, useState } from 'react';
import { shallowEqual, useDispatch, useSelector } from 'react-redux';
import FontAwesome from 'react-fontawesome';
import PropTypes from 'prop-types';
import RenderRelease from 'components/renderRelease';
import SortReleases from './sortReleases';
import Spinner from 'components/spinner';
import { fetchCatalogue } from 'features/releases';
import styles from './home.module.css';
import { toastInfo } from 'features/toast';

const Home = props => {
  const { service } = props.match.params;

  const { catalogue, catalogueLimit, catalogueSkip, reachedEndOfCat } = useSelector(
    state => state.releases,
    shallowEqual
  );

  const dispatch = useDispatch();
  const [isFetching, setFetching] = useState(false);
  const [isLoading, setLoading] = useState(true);
  const [sortPath, setSortPath] = useState('dateCreated');
  const [sortOrder, setSortOrder] = useState(-1);

  const handleFetchCatalogue = useCallback(
    async (path = sortPath, order = sortOrder, isPaging = false) => {
      setFetching(true);
      await dispatch(fetchCatalogue(catalogueLimit, catalogueSkip, path, order, isPaging));
      setFetching(false);
    },
    [catalogueLimit, catalogueSkip, dispatch, sortOrder, sortPath]
  );

  useEffect(() => {
    if (!catalogue.length) {
      handleFetchCatalogue().then(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [catalogue.length, handleFetchCatalogue]);

  useEffect(() => {
    if (service) {
      const serviceName = `${service.charAt(0).toUpperCase()}${service.substring(1)}`;
      dispatch(toastInfo(`You are now logged in using your ${serviceName} account.`));
    }
  }, [dispatch, service]);

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
          <SortReleases
            handleFetchCatalogue={handleFetchCatalogue}
            sortPath={sortPath}
            setSortPath={setSortPath}
            sortOrder={sortOrder}
            setSortOrder={setSortOrder}
          />
          <div className={styles.frontPage}>
            {catalogue.map(release => (
              <RenderRelease key={release._id} release={release} />
            ))}
          </div>
          <div className="d-flex justify-content-center">
            <button
              className="btn btn-outline-primary btn-sm px-3 py-2 mt-3"
              disabled={isFetching || reachedEndOfCat}
              onClick={() => handleFetchCatalogue(sortPath, sortOrder, true)}
            >
              {reachedEndOfCat ? null : <FontAwesome name="refresh" spin={isFetching} className="mr-2" />}
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
