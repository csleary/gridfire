import React, { useEffect, useState } from 'react';
import {
  fetchArtistCatalogue,
  fetchRelease,
  playTrack,
  toastInfo
} from '../actions';
import RenderRelease from './RenderRelease';
import Spinner from './Spinner';
import { connect } from 'react-redux';
import { frontPage } from '../style/Home.module.css';
import styles from '../style/ArtistPage.module.css';

const ArtistPage = props => {
  const {
    artist: { releases, name },
    fetchArtistCatalogue,
    match
  } = props;

  const { artist } = match.params;

  const [isLoading, setLoading] = useState(true);

  useEffect(() => {
    fetchArtistCatalogue(artist).then(() => setLoading(false));
  }, [artist, fetchArtistCatalogue]);

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
          <h3>Releases</h3>
          <div className={frontPage}>{renderReleases()}</div>
        </div>
      </div>
    </main>
  );
};

function mapStateToProps(state) {
  return {
    artist: state.releases.artist
  };
}

export default connect(
  mapStateToProps,
  {
    fetchRelease,
    fetchArtistCatalogue,
    playTrack,
    toastInfo
  }
)(ArtistPage);
