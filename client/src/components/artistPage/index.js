import React, { useEffect, useState } from 'react';
import { shallowEqual, useDispatch, useSelector } from 'react-redux';
import RenderRelease from 'components/renderRelease';
import Spinner from 'components/spinner';
import { fetchArtistCatalogue } from 'features/releases';
import { frontPage } from 'components/home/home.module.css';
import styles from './artistPage.module.css';
import { useParams } from 'react-router-dom';

const ArtistPage = () => {
  const { artistId } = useParams();
  const dispatch = useDispatch();
  const { name, releases } = useSelector(state => state.releases.artist, shallowEqual);
  const [isLoading, setLoading] = useState(true);

  useEffect(() => {
    dispatch(fetchArtistCatalogue(artistId)).then(() => setLoading(false));
  }, [dispatch, artistId]);

  const renderReleases = () => {
    if (!releases) return;
    return releases.map(release => <RenderRelease key={release._id} release={release} />);
  };

  if (isLoading) {
    return (
      <Spinner>
        <h2 className="mt-4">Loading artist catalogue&hellip;</h2>
      </Spinner>
    );
  }

  return (
    <main className="container-fluid">
      <div className="row">
        <div className="col py-3">
          <h2 className={styles.artist}>{name}</h2>
          <h3 className={styles.title}>Releases</h3>
          <div className={frontPage}>{renderReleases()}</div>
        </div>
      </div>
    </main>
  );
};

export default ArtistPage;
