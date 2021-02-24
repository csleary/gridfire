import React, { useEffect, useMemo } from 'react';
import { animated, config, useTransition } from 'react-spring';
import DownloadButton from './downloadButton';
import PropTypes from 'prop-types';
import Summary from './summary';
import TextSpinner from 'components/textSpinner';
import Transactions from './transactions';
import styles from './payments.module.css';
import { useApi } from 'hooks/useApi';

const Payments = ({ paymentInfoLoading, artistName, paymentHash, price, releaseId, releaseTitle }) => {
  const paymentData = useMemo(() => ({ releaseId, paymentHash }), [releaseId, paymentHash]);
  const initialData = { hasPurchased: false, nemNode: '', amountPaid: 0, transactions: [] };

  const { data: payments = initialData, error, fetch, isFetching, isLoading } = useApi('/api/user/transactions', {
    method: 'post',
    data: paymentData,
    shouldFetch: !paymentInfoLoading
  });

  const transition = useTransition(isLoading, {
    config: payments.hasPurchased ? { ...config.stiff, clamp: true } : { ...config.slow, clamp: true },
    from: { opacity: 0, transform: 'translateY(-0.25rem) scale(0.98)' },
    enter: { opacity: 1, transform: 'translateY(0) scale(1.0)' },
    leave: { opacity: 0, transform: 'translateY(-0.25rem) scale(0.98)' }
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

  if (paymentInfoLoading) return null;

  const { hasPurchased, transactions } = payments;

  return transition((style, item) =>
    !item ? (
      <animated.div className={styles.payments} style={style}>
        <DownloadButton
          artistName={artistName}
          format="mp3"
          hasPurchased={hasPurchased}
          releaseId={releaseId}
          releaseTitle={releaseTitle}
        />
        <Summary payments={payments} fetch={fetch} isFetching={isFetching} paymentData={paymentData} price={price} />
        <Transactions transactions={transactions} error={error} />
      </animated.div>
    ) : (
      <animated.div className={styles.loading} style={style}>
        <TextSpinner isActive={item} type="nemp3" speed={0.01} className={styles.spinner} />
        Searching for payments&hellip;
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
