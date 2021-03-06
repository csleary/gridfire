import { Link, useParams } from 'react-router-dom';
import React, { useEffect, useRef } from 'react';
import { Route, Switch, useRouteMatch } from 'react-router-dom';
import { fetchRelease, setIsLoading } from 'features/releases';
import { shallowEqual, useDispatch, useSelector } from 'react-redux';
import Artwork from './artwork';
import CLine from './cLine';
import CatNumber from './catNumber';
import CollectionIndicator from './collectionIndicator';
import Credits from './credits';
import FavButton from './favButton';
import { Helmet } from 'react-helmet';
import Info from './info';
import PLine from './pLine';
import Payment from 'pages/payment';
import Price from './price';
import PrivateRoute from 'components/privateRoute';
import PurchaseButton from './purchaseButton';
import RecordLabel from './recordLabel';
import ReleaseDate from './releaseDate';
import Tags from './tags';
import TrackList from './trackList';
import WishListButton from './wishListButton';
import classnames from 'classnames';
import { fetchUser } from 'features/user';
import { fetchXemPrice } from 'features/nem';
import styles from 'pages/activeRelease/activeRelease.module.css';

const ActiveRelease = () => {
  const dispatch = useDispatch();
  const { releaseId } = useParams();
  const trailRef = useRef();
  const { path } = useRouteMatch();
  const { isLoading, activeRelease: release } = useSelector(state => state.releases, shallowEqual);
  const { priceError, xemPriceUsd } = useSelector(state => state.nem, shallowEqual);
  const { purchases } = useSelector(state => state.user, shallowEqual);
  const isInCollection = purchases.some(sale => sale.release === releaseId);

  const {
    artist,
    artistName,
    catNumber,
    credits,
    info,
    price,
    pubName,
    pubYear,
    recName,
    recYear,
    recordLabel,
    releaseTitle,
    releaseDate,
    trackList
  } = release;

  useEffect(() => {
    if (releaseId !== release._id) dispatch(setIsLoading(true));
  }, [release._id, releaseId]);

  useEffect(() => {
    dispatch(fetchRelease(releaseId)).then(() => dispatch(setIsLoading(false)));
  }, [releaseId]);

  useEffect(() => {
    dispatch(fetchUser());
    dispatch(fetchXemPrice());
  }, []);

  const trackListClassName = classnames({ [styles.columns]: trackList?.length > 10 });

  return (
    <main className={classnames(styles.root, 'container')}>
      <Helmet>
        <title>{isLoading ? 'Loading…' : `${releaseTitle} | ${artistName}`}</title>
        <meta name="description" content={`Listen to \u2018${releaseTitle}\u2019 by ${artistName}.`} />
      </Helmet>
      <div className={classnames(styles.release, 'row')}>
        <div className={classnames(styles.col, 'col-md-6')}>
          <Artwork />
          <div className={styles.buttons}>
            <FavButton />
            <WishListButton />
          </div>
        </div>
        <div className={classnames(styles.info, 'col-md-6')}>
          <CollectionIndicator inCollection={isInCollection} />
          <h2 className={styles.title}>{releaseTitle}</h2>
          <h4 className={styles.name}>
            <Link to={`/artist/${artist}`}>{artistName}</Link>
          </h4>
          <Price price={price} priceError={priceError} xemPriceUsd={xemPriceUsd} />
          <Switch>
            <PrivateRoute path={`${path}/payment`} component={Payment} />
            <Route path={`${path}`}>
              <div className={trackListClassName}>
                <ol className={styles.trackList}>
                  <TrackList />
                </ol>
              </div>
              {isLoading ? null : (
                <PurchaseButton
                  inCollection={isInCollection}
                  price={price}
                  priceError={priceError}
                  releaseId={releaseId}
                />
              )}
              <ReleaseDate releaseDate={releaseDate} />
              <RecordLabel recordLabel={recordLabel} />
              <CatNumber catNumber={catNumber} />
              <Info info={info} />
              <Credits credits={credits} />
              <CLine pubName={pubName} pubYear={pubYear} />
              <PLine recName={recName} recYear={recYear} />
              <Tags trailRef={trailRef} />
            </Route>
          </Switch>
        </div>
      </div>
    </main>
  );
};

export default ActiveRelease;
