import React, { useEffect, useMemo } from 'react';
import DownloadButton from './downloadButton';
import FontAwesome from 'react-fontawesome';
import PropTypes from 'prop-types';
import Spinner from 'components/spinner';
import Summary from './summary';
import Transactions from './transactions';
import { useApi } from 'hooks/useApi';
import withDownload from './withDownload';

const Download = withDownload(DownloadButton);

const Payments = props => {
  const { artistName, paymentHash, price, releaseId, releaseTitle, roundUp } = props;
  const paymentData = useMemo(() => ({ releaseId, paymentHash }), [releaseId, paymentHash]);

  const initialData = {
    hasPurchased: false,
    nemNode: '',
    paidToDate: 0,
    transactions: []
  };

  const { data = initialData, error, fetch, isFetching, isLoading } = useApi(
    '/api/user/transactions',
    'post',
    paymentData
  );

  useEffect(() => {
    const updateTxs = () => {
      if (data && !data.hasPurchased) {
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
  }, [data, fetch, paymentData]);

  if (isLoading) {
    return (
      <Spinner>
        <h3>
          <FontAwesome name="search" className="yellow mr-2" />
          Searching for Payments&hellip;
        </h3>
      </Spinner>
    );
  }

  const { hasPurchased, nemNode, paidToDate, transactions } = data;

  return (
    <>
      <Download
        artistName={artistName}
        format="mp3"
        hasPurchased={hasPurchased}
        releaseId={releaseId}
        releaseTitle={releaseTitle}
      />
      <Summary
        fetch={fetch}
        hasPurchased={hasPurchased}
        isFetching={isFetching}
        nemNode={nemNode}
        paidToDate={paidToDate}
        paymentData={paymentData}
        price={price}
        roundUp={roundUp}
        transactions={transactions}
      />
      <Transactions transactions={transactions} error={error} />
    </>
  );
};

Payments.propTypes = {
  artistName: PropTypes.string,
  paymentHash: PropTypes.string,
  price: PropTypes.string,
  releaseId: PropTypes.string,
  releaseTitle: PropTypes.string,
  roundUp: PropTypes.func
};

export default Payments;
