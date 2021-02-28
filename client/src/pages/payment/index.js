import React, { useEffect } from 'react';
import { batch, shallowEqual, useDispatch, useSelector } from 'react-redux';
import { resetPayment, setIsLoading } from 'features/payment';
import Button from 'components/button';
import PaymentMethods from './paymentMethods';
import Payments from './payments';
import PropTypes from 'prop-types';
import { createAction } from '@reduxjs/toolkit';
import { faChevronLeft } from '@fortawesome/free-solid-svg-icons';
import styles from './payment.module.css';
import { useHistory } from 'react-router-dom';

const Payment = props => {
  const { releaseId } = props.match.params;
  const dispatch = useDispatch();
  const history = useHistory();
  const { userId } = useSelector(state => state.user, shallowEqual);

  useEffect(() => {
    const subscribe = createAction('payment/subscribe', payload => ({ payload }));

    batch(() => {
      dispatch(setIsLoading(true));
      dispatch(subscribe({ releaseId, userId }));
    });
  }, [releaseId, userId]);

  useEffect(() => {
    return () => {
      const unsubscribe = createAction('payment/unsubscribe', payload => ({ payload }));

      batch(() => {
        dispatch(unsubscribe({ userId }));
        dispatch(resetPayment());
      });
    };
  }, []); // eslint-disable-line

  return (
    <>
      <Button className={styles.back} icon={faChevronLeft} onClick={() => history.goBack()} size="small" textLink>
        Back
      </Button>
      <h2 className={styles.heading}>Payment</h2>
      <PaymentMethods />
      <Payments />
    </>
  );
};

Payment.propTypes = {
  match: PropTypes.object
};

export default Payment;
