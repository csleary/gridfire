import Button from 'components/button';
import PaymentMethods from './paymentMethods';
import Payments from './payments';
import PropTypes from 'prop-types';
import React from 'react';
import styles from './payment.module.css';
import { toastError } from 'features/toast';
import { useApi } from 'hooks/useApi';
import { useDispatch } from 'react-redux';
import { useHistory } from 'react-router-dom';

const defaults = { release: {}, paymentInfo: {}, price: '' };

const Payment = props => {
  const { releaseId } = props.match.params;
  const { data = defaults, error, isLoading } = useApi(`/api/purchase/${releaseId}`);
  const dispatch = useDispatch();
  const history = useHistory();
  if (error) dispatch(toastError(error));

  const {
    release: { artistName, releaseTitle },
    paymentInfo: { paymentAddress, paymentHash },
    price
  } = data;

  return (
    <>
      <Button
        className={styles.back}
        icon={'chevron-left'}
        onClick={() => history.push(`/release/${releaseId}`)}
        size="small"
        textLink
      >
        Back
      </Button>
      <h2 className={styles.heading}>Payment</h2>
      <PaymentMethods
        isLoading={isLoading}
        paymentAddress={paymentAddress}
        paymentHash={paymentHash}
        priceInXem={price}
      />
      <Payments
        artistName={artistName}
        paymentInfoLoading={isLoading}
        paymentHash={paymentHash}
        price={price}
        releaseId={releaseId}
        releaseTitle={releaseTitle}
      />
    </>
  );
};

Payment.propTypes = {
  match: PropTypes.object,
  releaseId: PropTypes.string
};

export default Payment;
