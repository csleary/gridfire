import React, { useEffect, useState } from 'react';
import { Route, Switch, useRouteMatch } from 'react-router-dom';
import {
  fetchRelease,
  fetchUser,
  fetchXemPrice,
  playTrack,
  playerPause,
  playerPlay,
  searchReleases,
  toastInfo
} from 'actions';
import Artwork from './artwork';
import CLine from './cLine';
import CatNumber from './catNumber';
import CollectionIndicator from './collectionIndicator';
import Credits from './credits';
import Info from './info';
import { Link } from 'react-router-dom';
import PLine from './pLine';
import Payment from 'components/payment';
import Price from './price';
import PrivateRoute from 'components/privateRoute';
import PropTypes from 'prop-types';
import PurchaseButton from './purchaseButton';
import RecordLabel from './recordLabel';
import ReleaseDate from './releaseDate';
import Spinner from 'components/spinner';
import Tags from './tags';
import TrackList from './trackList';
import classNames from 'classnames';
import { connect } from 'react-redux';
import styles from 'components/selectedRelease/selectedRelease.module.css';

const SelectedRelease = props => {
  const [isLoading, setLoading] = useState(true);
  const [inCollection, setInCollection] = useState(false);
  const { path } = useRouteMatch();

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
          <Switch>
            <PrivateRoute path={`${path}/payment`} component={Payment} />
            <Route path={`${path}`}>
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
            </Route>
          </Switch>
        </div>
      </div>
    </main>
  );
};

SelectedRelease.propTypes = {
  fetchRelease: PropTypes.func,
  fetchUser: PropTypes.func,
  fetchXemPrice: PropTypes.func,
  match: PropTypes.object,
  player: PropTypes.object,
  playerPause: PropTypes.func,
  playerPlay: PropTypes.func,
  playTrack: PropTypes.func,
  release: PropTypes.object,
  searchReleases: PropTypes.func,
  tags: PropTypes.array,
  toastInfo: PropTypes.func,
  user: PropTypes.object,
  xemPriceUsd: PropTypes.number
};

function mapStateToProps(state) {
  return {
    player: state.player,
    release: state.releases.selectedRelease,
    user: state.user,
    xemPriceUsd: state.nem.xemPriceUsd
  };
}

export default connect(mapStateToProps, {
  fetchRelease,
  fetchUser,
  fetchXemPrice,
  playerPause,
  playerPlay,
  playTrack,
  searchReleases,
  toastInfo
})(SelectedRelease);
