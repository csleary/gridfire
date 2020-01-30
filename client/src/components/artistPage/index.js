import React, { useEffect, useState } from 'react';
import {
  fetchArtistCatalogue,
  fetchRelease,
  playTrack,
  toastInfo
} from 'actions';
import PropTypes from 'prop-types';
import RenderRelease from 'components/renderRelease';
import Spinner from 'components/spinner';
import { connect } from 'react-redux';
import { frontPage } from 'components/home/home.module.css';
import styles from './artistPage.module.css';

const ArtistPage = props => {
  const {
    artist: { releases, name },
    fetchArtistCatalogue: fetchArtist,
    match
  } = props;

  const { artist } = match.params;

  const [isLoading, setLoading] = useState(true);

  useEffect(() => {
    fetchArtist(artist).then(() => setLoading(false));
  }, [fetchArtist, artist]);

  const renderReleases = () => {
    if (!releases) return;

    return releases.map(release => (
      <RenderRelease
        fetchRelease={props.fetchRelease}
        key={release._id}
        playTrack={props.playTrack}
        release={release}
        toastInfo={props.toastInfo}
      />
    ));
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

ArtistPage.propTypes = {
  artist: PropTypes.object,
  fetchArtistCatalogue: PropTypes.func,
  fetchRelease: PropTypes.func,
  match: PropTypes.object,
  playTrack: PropTypes.func,
  toastInfo: PropTypes.func
};

function mapStateToProps(state) {
  return {
    artist: state.releases.artist
  };
}

export default connect(mapStateToProps, {
  fetchRelease,
  fetchArtistCatalogue,
  playTrack,
  toastInfo
})(ArtistPage);
