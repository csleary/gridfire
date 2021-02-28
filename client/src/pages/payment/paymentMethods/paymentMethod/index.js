import { animated, config, useTransition } from 'react-spring';
import { faAndroid, faApple } from '@fortawesome/free-brands-svg-icons';
import { shallowEqual, useSelector } from 'react-redux';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import ManualPayment from './manualPayment';
import PropTypes from 'prop-types';
import QRCode from 'components/qrCode';
import React from 'react';
import styles from './paymentMethod.module.css';

const Loader = () => <div className={styles.loader} />;

const PaymentMethod = ({ showManualPayment }) => {
  const { isLoading, paymentInfo, priceInRawXem } = useSelector(state => state.payment, shallowEqual);
  const { paymentAddress = '', paymentHash = '' } = paymentInfo;
  const states = isLoading ? 1 : showManualPayment ? 2 : 3;

  const transition = useTransition(states, {
    config: { ...config.stiff, clamp: true },
    initial: { opacity: 0, transform: 'scale(0.95)' },
    from: { opacity: 0, transform: 'scale(0.98)' },
    enter: { opacity: 1, transform: 'scale(1)' },
    leave: { opacity: 0, transform: 'scale(0.98)' }
  });

  return transition((style, index) =>
    index === 1 ? (
      <animated.div className={styles.wrapper} style={style}>
        <Loader />
      </animated.div>
    ) : index === 2 ? (
      <animated.div className={styles.wrapper} style={style}>
        <ManualPayment
          paymentAddress={paymentAddress}
          paymentHash={paymentHash}
          priceInXem={(priceInRawXem * 10 ** -6).toFixed(6)}
        />
      </animated.div>
    ) : (
      <animated.div className={styles.wrapper} style={style}>
        <div className={styles.qrcode}>
          <QRCode
            paymentAddress={paymentAddress.replace(/-/g, '')}
            price={(priceInRawXem * 10 ** -6).toFixed(6)}
            idHash={paymentHash}
          />
        </div>
        <p className="text-center">
          Scan to pay on{' '}
          <a href="https://itunes.apple.com/us/app/nem-wallet/id1227112677">
            <FontAwesomeIcon icon={faApple} className="mr-1" />
            iOS
          </a>{' '}
          or{' '}
          <a href="https://play.google.com/store/apps/details?id=org.nem.nac.mainnet&hl=en">
            <FontAwesomeIcon icon={faAndroid} className="mr-1" />
            Android
          </a>
        </p>
      </animated.div>
    )
  );
};

PaymentMethod.propTypes = {
  showManualPayment: PropTypes.bool
};

export default PaymentMethod;
