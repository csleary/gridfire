import { Link, useParams } from 'react-router-dom';
import React, { useEffect, useState } from 'react';
import { Route, Switch, useRouteMatch } from 'react-router-dom';
import { batch, shallowEqual, useDispatch, useSelector } from 'react-redux';
import Artwork from './artwork';
import CLine from './cLine';
import CatNumber from './catNumber';
import CollectionIndicator from './collectionIndicator';
import Credits from './credits';
import FavButton from './favButton';
import Info from './info';
import PLine from './pLine';
import Payment from 'components/payment';
import Price from './price';
import PrivateRoute from 'components/privateRoute';
import PurchaseButton from './purchaseButton';
import RecordLabel from './recordLabel';
import ReleaseDate from './releaseDate';
import Spinner from 'components/spinner';
import Tags from './tags';
import TrackList from './trackList';
import WishListButton from './wishListButton';
import classNames from 'classnames';
import { fetchRelease } from 'features/releases';
import { fetchUser } from 'features/user';
import { fetchXemPrice } from 'features/nem';
import styles from 'components/selectedRelease/selectedRelease.module.css';

const SelectedRelease = () => {
  const dispatch = useDispatch();
  const { releaseId } = useParams();
  const [isLoading, setLoading] = useState(true);
  const { path } = useRouteMatch();
  const { purchases } = useSelector(state => state.user, shallowEqual);
  const release = useSelector(state => state.releases.selectedRelease, shallowEqual);
  const { priceError, xemPriceUsd } = useSelector(state => state.nem, shallowEqual);
  const isInCollection = purchases.some(purchase => purchase.releaseId === releaseId);
  const { artist, artistName, catNumber, credits, cLine, info, pLine, price, recordLabel, releaseTitle } = release;
  const { releaseDate, trackList } = release;

  useEffect(() => {
    setLoading(true);
    batch(() => {
      dispatch(fetchUser());
      dispatch(fetchXemPrice());
      dispatch(fetchRelease(releaseId)).then(() => setLoading(false));
    });
  }, [dispatch, releaseId]);

  const trackListClassName = classNames({ [styles.columns]: trackList?.length > 10 });

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
          <Artwork />
          <div className={styles.buttons}>
            <FavButton />
            <WishListButton />
          </div>
        </div>
        <div className={`${styles.info} col-md-6 p-3`}>
          <CollectionIndicator inCollection={isInCollection} />
          <h2 className={styles.title}>{releaseTitle}</h2>
          <h4 className={styles.name}>
            <Link to={`/artist/${artist}`}>{artistName}</Link>
          </h4>
          <h6 className={`${styles.price} text-center`}>
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
              <Tags />
            </Route>
          </Switch>
        </div>
      </div>
    </main>
  );
};

export default SelectedRelease;
