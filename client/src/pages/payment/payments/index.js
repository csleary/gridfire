import React, { useEffect, useMemo } from 'react';
import { animated, useTransition } from 'react-spring';
import DownloadButton from './downloadButton';
import PropTypes from 'prop-types';
import Spinner from 'components/spinner';
import Summary from './summary';
import Transactions from './transactions';
import styles from './payments.module.css';
import { useApi } from 'hooks/useApi';
import withDownload from './withDownload';

const Download = withDownload(DownloadButton);

const Payments = props => {
  const { artistName, paymentHash, price, releaseId, releaseTitle } = props;
  const paymentData = useMemo(() => ({ releaseId, paymentHash }), [releaseId, paymentHash]);

  const initialData = {
    hasPurchased: false,
    nemNode: '',
    amountPaid: 0,
    transactions: []
  };

  const { data: payments = initialData, error, fetch, isFetching, isLoading } = useApi(
    '/api/user/transactions',
    'post',
    paymentData
  );

  const transition = useTransition(isLoading, null, {
    config: { mass: 1, tension: 200, friction: 20, easing: 'cubic-bezier(0.2, 0.8, 0.4, 1)' },
    from: { opacity: 0, transform: 'translateY(-2rem) scale(0.95)' },
    enter: { opacity: 1, transform: 'translateY(0) scale(1.0)' },
    leave: { opacity: 0, transform: 'translateY(-2rem) scale(0.95)' }
  });

  useEffect(() => {
    const updateTxs = () => {
      if (payments && !payments.hasPurchased) {
        fetch('/api/user/transactions', 'post', paymentData);
      } else {
        window.clearInterval(txInterval);
        clearTimeout(txTimeout);
      }
    };

    const txInterval = window.setInterval(updateTxs, 30000);
    const txTimeout = setTimeout(txInterval, 30000);

    return () => {
      window.clearInterval(txInterval);
      clearTimeout(txTimeout);
    };
  }, [payments, fetch, paymentData]);

  if (isLoading) {
    return (
      <Spinner className={styles.spinner} wrapperClassName={styles.wrapper}>
        <div>Searching for payments&hellip;</div>
      </Spinner>
    );
  }

  const { hasPurchased, transactions } = payments;

  return transition.map(
    ({ item, props: style, key }) =>
      !item && (
        <animated.div key={key} style={style}>
          <Download
            artistName={artistName}
            format="mp3"
            hasPurchased={hasPurchased}
            releaseId={releaseId}
            releaseTitle={releaseTitle}
          />
          <Summary payments={payments} fetch={fetch} isFetching={isFetching} paymentData={paymentData} price={price} />
          <Transactions transactions={transactions} error={error} />
        </animated.div>
      )
  );
};

Payments.propTypes = {
  artistName: PropTypes.string,
  paymentHash: PropTypes.string,
  price: PropTypes.string,
  releaseId: PropTypes.string,
  releaseTitle: PropTypes.string
};

export default Payments;
