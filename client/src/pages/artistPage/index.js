import React, { useEffect, useState } from 'react';
import { shallowEqual, useDispatch, useSelector } from 'react-redux';
import { Helmet } from 'react-helmet';
import RenderRelease from 'components/renderRelease';
import Spinner from 'components/spinner';
import { fetchArtistCatalogue } from 'features/releases';
import styles from './artistPage.module.css';
import { useParams } from 'react-router-dom';

const ArtistPage = () => {
  const { artistId, artistSlug } = useParams();
  const dispatch = useDispatch();
  const { biography, links, name, releases } = useSelector(state => state.releases.artist, shallowEqual);
  const [isLoading, setLoading] = useState(false);
  const releaseCount = releases?.length;

  useEffect(() => {
    if (!releaseCount) setLoading(true);
  }, [releaseCount]);

  useEffect(() => {
    dispatch(fetchArtistCatalogue(artistId, artistSlug)).then(() => setLoading(false));
  }, [dispatch, artistId, artistSlug]);

  if (isLoading) {
    return (
      <Spinner>
        <h2 className="mt-4">Loading artist catalogue&hellip;</h2>
      </Spinner>
    );
  }

  return (
    <main className="container-fluid">
      <Helmet>
        <title>{isLoading ? 'Loading…' : name}</title>
        <meta name="description" content={`Listen to ${releaseCount} releases by ${name}.`} />
      </Helmet>
      <div className="row">
        <div className={`${styles.title} col`}>
          <h2 className={styles.artist}>{name}</h2>
        </div>
      </div>
      <div className={`${styles.container} row`}>
        <section className={`${styles.releases} col-lg-8`}>
          <h3 className={styles.title}>
            {releaseCount} Release{releaseCount > 1 ? 's' : ''}
          </h3>
          <div className={styles.grid}>
            {releases?.map(release => (
              <RenderRelease key={release._id} showArtist={false} release={release} />
            ))}
          </div>
        </section>
        <section className={`${styles.info} col-lg-4`}>
          {biography ? (
            <>
              <h3 className={styles.title}>Biography</h3>
              <div className={styles.biography}>
                {biography
                  .split('\n')
                  .filter(text => text.trim().length)
                  .map((paragraph, index) => (
                    <p key={index}>{paragraph}</p>
                  ))}
              </div>
            </>
          ) : null}
          {links?.length ? (
            <div className={styles.links}>
              <h3 className={styles.title}>Links</h3>
              <ul className={styles.linksList}>
                {links.map(({ title, uri }) => (
                  <li className={styles.link} key={uri}>
                    <a href={uri} rel="nofollow noopener">
                      {title}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </section>
      </div>
    </main>
  );
};

export default ArtistPage;
