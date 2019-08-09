import React, { useEffect, useState } from 'react';
import {
  fetchRelease,
  fetchUser,
  fetchXemPrice,
  playTrack,
  playerPause,
  playerPlay,
  searchReleases,
  toastInfo
} from '../actions';
import Artwork from './selectedRelease/Artwork';
import CLine from './selectedRelease/CLine';
import CatNumber from './selectedRelease/CatNumber';
import CollectionIndicator from './selectedRelease/CollectionIndicator';
import Credits from './selectedRelease/Credits';
import Info from './selectedRelease/Info';
import { Link } from 'react-router-dom';
import PLine from './selectedRelease/PLine';
import Price from './selectedRelease/Price';
import PurchaseButton from './selectedRelease/PurchaseButton';
import RecordLabel from './selectedRelease/RecordLabel';
import ReleaseDate from './selectedRelease/ReleaseDate';
import Spinner from './Spinner';
import Tags from './selectedRelease/Tags';
import TrackList from './selectedRelease/TrackList';
import classNames from 'classnames';
import { connect } from 'react-redux';
import styles from '../style/SelectedRelease.module.css';

const SelectedRelease = props => {
  const [isLoading, setLoading] = useState(true);
  const [inCollection, setInCollection] = useState(false);

  const {
    fetchRelease,
    fetchUser,
    fetchXemPrice,
    player,
    release,
    release: {
      artist,
      artistName,
      catNumber,
      credits,
      cLine,
      info,
      pLine,
      price,
      recordLabel,
      releaseTitle,
      releaseDate,
      trackList,
      tags
    },
    user,
    xemPriceUsd
  } = props;

  const { purchases } = user;
  const { releaseId } = props.match.params;

  useEffect(() => {
    setLoading(true);
    fetchUser();
    fetchXemPrice();
    fetchRelease(releaseId).then(() => setLoading(false));
  }, [fetchRelease, fetchUser, fetchXemPrice, releaseId]);

  useEffect(() => {
    const inCollection = purchases.some(
      purchase => purchase.releaseId === releaseId
    );

    if (inCollection) setInCollection(true);
  }, [purchases, releaseId]);

  const trackListColumns = classNames({
    [styles.columns]: trackList.length > 10
  });

  const nowPlayingToast = trackTitle => {
    props.toastInfo(`Loading '${trackTitle}'`);
  };

  if (isLoading) {
    return (
      <Spinner>
        <h2 className="mt-4">Loading release&hellip;</h2>
      </Spinner>
    );
  }

  return (
    <main className="container d-flex align-items-center">
      <div className={`${styles.release} row`}>
        <div className={`${styles.col} col-md-6 p-3`}>
          <Artwork
            isPlaying={player.isPlaying}
            nowPlayingToast={nowPlayingToast}
            playerPause={props.playerPause}
            playerPlay={props.playerPlay}
            playerReleaseId={player.releaseId}
            playTrack={props.playTrack}
            release={release}
          />
        </div>
        <div className={`${styles.info} col-md-6 p-3`}>
          <CollectionIndicator inCollection={inCollection} />
          <h2 className={`${styles.title} text-center ibm-type-italic`}>
            {releaseTitle}
          </h2>
          <h4 className={`${styles.name} text-center`}>
            <Link to={`/artist/${artist}`}>{artistName}</Link>
          </h4>
          <h6 className={`${styles.price} text-center`}>
            <Price price={price} xemPriceUsd={xemPriceUsd} />
          </h6>
          <div className={trackListColumns}>
            <ol className={styles.trackList}>
              <TrackList
                nowPlayingToast={nowPlayingToast}
                player={player}
                playerPlay={props.playerPlay}
                playTrack={props.playTrack}
                release={release}
              />
            </ol>
          </div>
          <PurchaseButton
            inCollection={inCollection}
            price={price}
            releaseId={releaseId}
          />
          <ReleaseDate releaseDate={releaseDate} />
          <RecordLabel recordLabel={recordLabel} />
          <CatNumber catNumber={catNumber} />
          <Info info={info} />
          <Credits credits={credits} />
          <CLine cLine={cLine} />
          <PLine pLine={pLine} />
          <Tags searchReleases={props.searchReleases} tags={tags} />
        </div>
      </div>
    </main>
  );
};

function mapStateToProps(state) {
  return {
    player: state.player,
    release: state.releases.selectedRelease,
    user: state.user,
    xemPriceUsd: state.nem.xemPriceUsd
  };
}

export default connect(
  mapStateToProps,
  {
    fetchRelease,
    fetchUser,
    fetchXemPrice,
    playerPause,
    playerPlay,
    playTrack,
    searchReleases,
    toastInfo
  }
)(SelectedRelease);
