import React, { useEffect, useMemo } from 'react';
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

  return (
    <>
      <Download
        artistName={artistName}
        format="mp3"
        hasPurchased={hasPurchased}
        releaseId={releaseId}
        releaseTitle={releaseTitle}
      />
      <Summary payments={payments} fetch={fetch} isFetching={isFetching} paymentData={paymentData} price={price} />
      <Transactions transactions={transactions} error={error} />
    </>
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
