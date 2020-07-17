import { Link } from 'react-router-dom';
import PaymentMethods from './paymentMethods';
import Payments from './payments';
import PropTypes from 'prop-types';
import React from 'react';
import Spinner from 'components/spinner';
import { connect } from 'react-redux';
import { toastError } from 'features/toast';
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
      <>
        <h2 className="text-center">Payment</h2>
        <p>
          Unfortunately, <Link to={`/artist/${artist}`}>{artistName}</Link> doesn&rsquo;t have a NEM payment address in
          their account, so we are unable to process payments for them at the moment.
        </p>
        <p>Hopefully they&rsquo;ll have an address in place soon!</p>
      </>
    );
  }

  return (
    <>
      <h2 className="text-center mt-4">Payment</h2>
      <PaymentMethods paymentAddress={paymentAddress} paymentHash={paymentHash} priceInXem={priceInXem} />
      <Payments
        artistName={artistName}
        paymentHash={paymentHash}
        price={priceInXem}
        releaseId={releaseId}
        releaseTitle={releaseTitle}
        roundUp={roundUp}
      />
    </>
  );
};

Payment.propTypes = {
  match: PropTypes.object,
  releaseId: PropTypes.string
};

export default connect(null, { toastError })(Payment);
