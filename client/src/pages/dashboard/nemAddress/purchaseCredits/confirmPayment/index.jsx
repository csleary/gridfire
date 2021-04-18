import React, { useCallback, useEffect, useRef, useState } from 'react';
import { faBomb, faCheck, faCheckCircle, faChevronLeft, faCircle } from '@fortawesome/free-solid-svg-icons';
import { shallowEqual, useDispatch, useSelector } from 'react-redux';
import Button from 'components/button';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import PropTypes from 'prop-types';
import Spinner from 'components/spinner';
import Transactions from 'pages/payment/payments/transactions';
import axios from 'axios';
import classnames from 'classnames';
import { createClientId } from 'utils';
import { fetchUserCredits } from 'features/user';
import styles from './confirmPayment.module.css';

const ConfirmPayment = ({ paymentData: { nonce, paymentId }, setStage, setShowPaymentModal }) => {
  const dispatch = useDispatch();
  const call = useRef();
  const txTimeout = useRef();
  const { idHash } = useSelector(state => state.user.auth, shallowEqual);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [{ hasPaid = false, transactions = [] }, setPayments] = useState({});

  const fetchTransactions = useCallback(async () => {
    try {
      if (call.current) call.current.cancel();
      if (txTimeout.current) clearTimeout(txTimeout.current);
      call.current = axios.CancelToken.source();
      const clientId = await createClientId({ idHash, nonce, paymentId });
      setIsUpdating(true);
      const res = await axios.post('/api/user/credits/confirm', clientId, { cancelToken: call.current.token });
      setPayments(res.data);
      if (isLoading) setIsLoading(false);
      setIsUpdating(false);

      if (res.data.hasPaid) {
        dispatch(fetchUserCredits());
      } else {
        txTimeout.current = setTimeout(fetchTransactions, 30000);
      }
    } catch (err) {
      setIsLoading(false);
      if (axios.isCancel(err)) return setIsUpdating(false);

      if (err.response) {
        setError(err.response.data.error);
      } else if (err.request) {
        setError('We could not process your request.');
      } else {
        setError(String(err));
      }
    }
  }, []); // eslint-disable-line

  useEffect(() => {
    fetchTransactions();

    return () => {
      clearTimeout(txTimeout.current);
    };
  }, []); // eslint-disable-line

  return (
    <>
      {error ? (
        <div className={styles.error}>
          <h4 className={styles.errorHeading}>
            <FontAwesomeIcon icon={faBomb} className="mr-2" />
            Error
          </h4>
          <p>{error}</p>
        </div>
      ) : isLoading ? (
        <Spinner>
          <h4 className={styles.loading}>Confirming payment&hellip;</h4>
        </Spinner>
      ) : (
        <>
          {hasPaid ? (
            <div className={styles.thanks}>
              <h4 className="green">
                <FontAwesomeIcon icon={faCheckCircle} className="green mr-2" />
                Thanks for supporting nemp3!
              </h4>
              <p>Your credits will be sent to your payment address shortly.</p>
            </div>
          ) : (
            <div className={styles.check}>
              <h3>No payments found yet…</h3>
              <p>We&rsquo;ll automatically check every 30 seconds, but you can also manually check below.</p>
              <Button
                iconClassName={classnames(styles.icon, { [styles.active]: isUpdating })}
                disabled={isUpdating}
                icon={faCircle}
                onClick={async () => {
                  setIsUpdating(true);
                  await fetchTransactions();
                  setIsUpdating(false);
                }}
                textLink
                title={'Press to check again for payments.'}
                type="button"
              >
                Scan
              </Button>
              <p className={styles.help}>
                Forgotten to send payment, or need to see the address again? Please restart a new payment session.
              </p>
            </div>
          )}
          {transactions.length ? (
            <>
              <h3 className={styles.heading}>Transactions</h3>
              <Transactions transactions={transactions} />
            </>
          ) : null}
        </>
      )}
      <div className={styles.confirm}>
        <Button
          disabled={isLoading}
          icon={faChevronLeft}
          onClick={() => setStage(1)}
          size="large"
          tabIndex="0"
          textLink
          type="button"
        >
          Restart
        </Button>
        <Button
          disabled={isLoading}
          icon={faCheck}
          onClick={() => setShowPaymentModal(false)}
          size="large"
          tabIndex="0"
          type="button"
        >
          Close
        </Button>
      </div>
    </>
  );
};

ConfirmPayment.propTypes = {
  closeModal: PropTypes.func,
  paymentData: PropTypes.object,
  sku: PropTypes.string,
  setShowPaymentModal: PropTypes.func,
  setStage: PropTypes.func
};

export default ConfirmPayment;
