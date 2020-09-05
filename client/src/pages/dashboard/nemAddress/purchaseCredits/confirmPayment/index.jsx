import React, { useCallback, useEffect, useState } from 'react';
import { shallowEqual, useDispatch, useSelector } from 'react-redux';
import Button from 'components/button';
import FontAwesome from 'react-fontawesome';
import PropTypes from 'prop-types';
import Spinner from 'components/spinner';
import Transactions from 'pages/payment/payments/transactions';
import axios from 'axios';
import classnames from 'classnames';
import { fetchUserCredits } from 'features/user';
import styles from './confirmPayment.module.css';

const ConfirmPayment = ({ paymentData: { nonce, paymentId }, setStage, setShowPaymentModal }) => {
  const dispatch = useDispatch();
  const { idHash } = useSelector(state => state.user.auth, shallowEqual);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [{ hasPaid = false, transactions = [] }, setPayments] = useState({});

  const createClientId = useCallback(async () => {
    const numbers = window.crypto.getRandomValues(new Uint8Array(16));
    const cnonce = Array.from(numbers, b => b.toString(16).padStart(2, '0')).join('');
    const encoder = new TextEncoder();
    const encoded = encoder.encode(cnonce.concat(idHash).concat(nonce).concat(paymentId));
    const hashBuffer = await crypto.subtle.digest('SHA-256', encoded);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const clientId = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    return { clientId, cnonce };
  }, [idHash, nonce, paymentId]);

  const fetchTransactions = useCallback(async () => {
    try {
      const clientId = await createClientId();
      const res = await axios.post('/api/user/credits/confirm', clientId);
      setPayments(res.data);
    } catch (err) {
      if (err.response) {
        setError(err.response.data.error);
      } else if (err.request) {
        setError('We could not process your request.');
      } else {
        setError(String(err));
      }
      setIsLoading(false);
    }
  }, [createClientId, setPayments]);

  useEffect(() => {
    const updateTxs = async () => {
      if (hasPaid) {
        window.clearInterval(txInterval);
        clearTimeout(txTimeout);
        dispatch(fetchUserCredits());
      } else {
        setIsUpdating(true);
        await fetchTransactions();
        setIsUpdating(false);
      }
    };

    let txInterval;
    let txTimeout;

    if (!hasPaid) {
      setIsLoading(true);
      fetchTransactions().then(() => setIsLoading(false));
      txInterval = window.setInterval(updateTxs, 30000);
      txTimeout = setTimeout(txInterval, 30000);
    }

    return () => {
      window.clearInterval(txInterval);
      clearTimeout(txTimeout);
    };
  }, [dispatch, fetchTransactions, hasPaid]);

  return (
    <>
      {error ? (
        <div className={styles.error}>
          <h4 className={styles.errorHeading}>
            <FontAwesome name="bomb" className="mr-2" />
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
                <FontAwesome name="check-circle" className="green mr-2" />
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
                icon="circle"
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
                Forgotten to send payment, or need to see the address again? Please start a new payment session.
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
          icon="chevron-left"
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
          icon="check"
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
