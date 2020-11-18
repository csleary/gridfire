import { Link, useParams } from 'react-router-dom';
import React, { useEffect, useRef } from 'react';
import { Route, Switch, useRouteMatch } from 'react-router-dom';
import { batch, shallowEqual, useDispatch, useSelector } from 'react-redux';
import { fetchRelease, setIsLoading } from 'features/releases';
import Artwork from './artwork';
import CLine from './cLine';
import CatNumber from './catNumber';
import CollectionIndicator from './collectionIndicator';
import Credits from './credits';
import FavButton from './favButton';
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
import classNames from 'classnames';
import { fetchUser } from 'features/user';
import { fetchXemPrice } from 'features/nem';
import styles from 'pages/activeRelease/activeRelease.module.css';

const ActiveRelease = () => {
  const dispatch = useDispatch();
  const { releaseId } = useParams();
  const trailRef = useRef();
  const { path } = useRouteMatch();
  const { purchases } = useSelector(state => state.user, shallowEqual);
  const { isLoading, activeRelease: release } = useSelector(state => state.releases, shallowEqual);
  const { priceError, xemPriceUsd } = useSelector(state => state.nem, shallowEqual);
  const isInCollection = purchases.some(sale => sale.release === releaseId);

  const {
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
    trackList
  } = release;

  const trackListClassName = classNames({ [styles.columns]: trackList?.length > 10 });

  useEffect(() => {
    if (releaseId !== release._id) dispatch(setIsLoading(true));
    batch(() => {
      dispatch(fetchUser());
      dispatch(fetchXemPrice());
      dispatch(fetchRelease(releaseId)).then(() => dispatch(setIsLoading(false)));
    });
  }, [dispatch, release._id, releaseId]);

  return (
    <main className="container d-flex align-items-center">
      <div className={`${styles.release} row`}>
        <div className={`${styles.col} col-md-6`}>
          <Artwork />
          <div className={styles.buttons}>
            <FavButton />
            <WishListButton />
          </div>
        </div>
        <div className={`${styles.info} col-md-6`}>
          <CollectionIndicator inCollection={isInCollection} />
          <h2 className={styles.title}>{releaseTitle}</h2>
          <h4 className={styles.name}>
            <Link to={`/artist/${artist}`}>{artistName}</Link>
          </h4>
          <h6 className={styles.price}>
            <Price price={price} priceError={priceError} xemPriceUsd={xemPriceUsd} />
          </h6>
          <Switch>
            <PrivateRoute path={`${path}/payment`} component={Payment} />
            <Route path={`${path}`}>
              <div className={trackListClassName}>
                <ol className={styles.trackList}>
                  <TrackList />
                </ol>
              </div>
              <PurchaseButton
                inCollection={isInCollection}
                price={price}
                priceError={priceError}
                releaseId={releaseId}
              />
              <ReleaseDate releaseDate={releaseDate} />
              <RecordLabel recordLabel={recordLabel} />
              <CatNumber catNumber={catNumber} />
              <Info info={info} />
              <Credits credits={credits} />
              <CLine cLine={cLine} />
              <PLine pLine={pLine} />
              <Tags trailRef={trailRef} />
            </Route>
          </Switch>
        </div>
      </div>
    </main>
  );
};

export default ActiveRelease;
