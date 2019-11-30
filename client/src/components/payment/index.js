import { Link } from 'react-router-dom';
import PaymentMethods from './paymentMethods';
import Payments from './payments';
import PropTypes from 'prop-types';
import React from 'react';
import Spinner from 'components/spinner';
import { connect } from 'react-redux';
import { toastError } from 'actions';
import { useApi } from 'hooks/useApi';

const roundUp = (value, precision) => {
  const factor = 10 ** precision;
  return Math.ceil(value * factor) / factor;
};

const Payment = props => {
  const { releaseId } = props.match.params;
  const { data, error, isLoading } = useApi(`/api/purchase/${releaseId}`);

  if (error) {
    toastError(error);
  }

  if (isLoading) {
    return (
      <Spinner>
        <h2 className="mt-4">Loading Payment Info&hellip;</h2>
      </Spinner>
    );
  }

  const {
    release: { artist, artistName, releaseTitle },
    paymentInfo: { paymentAddress, paymentHash },
    price
  } = data;

  const priceInXem = roundUp(price, 2).toFixed(2);

  if (!paymentAddress) {
    return (
      <main className="container">
        <div className="row">
          <div className="col">
            <h2 className="text-center">Payment</h2>
            <h3 className="text-center red">
              {artistName} &bull;{' '}
              <span className="ibm-type-italic">{releaseTitle}</span>
            </h3>
            <p className="text-center">
              Unfortunately, <Link to={`/artist/${artist}`}>{artistName}</Link>{' '}
              doesn&rsquo;t have a NEM payment address in their account, so we
              are unable to process payments for them at the moment.
            </p>
            <p className="text-center">
              Hopefully they&rsquo;ll have an address in place soon!
            </p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="container">
      <div className="row">
        <div className="col p-3">
          <h2 className="text-center mt-4">Payment</h2>
          <h3 className="text-center red">
            {artistName} &bull;{' '}
            <span className="ibm-type-italic">{releaseTitle}</span>
          </h3>
          <PaymentMethods
            paymentAddress={paymentAddress}
            paymentHash={paymentHash}
            priceInXem={priceInXem}
          />
        </div>
      </div>
      <Payments
        artistName={artistName}
        paymentHash={paymentHash}
        price={priceInXem}
        releaseId={releaseId}
        releaseTitle={releaseTitle}
        roundUp={roundUp}
      />
    </main>
  );
};

Payment.propTypes = {
  match: PropTypes.object,
  releaseId: PropTypes.string
};

export default connect(
  null,
  { toastError }
)(Payment);
