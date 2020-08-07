import { animated, useTransition } from 'react-spring';
import FontAwesome from 'react-fontawesome';
import ManualPayment from './manualPayment';
import PropTypes from 'prop-types';
import QRCode from './qrCode';
import React from 'react';
import styles from './paymentMethod.module.css';

const PaymentMethod = ({ paymentAddress, paymentHash, priceInXem, showManualPayment }) => {
  const transitions = useTransition(showManualPayment, null, {
    config: { mass: 1, tension: 250, friction: 30, easing: 'cubic-bezier(0.2, 0.8, 0.4, 1)' },
    from: { opacity: 0, position: 'absolute', left: '100%', right: '-100%', transform: 'scale(0.9)' },
    enter: { opacity: 1, left: '0', right: '0', transform: 'scale(1)' },
    leave: { opacity: 0, left: '-100%', right: '100%', transform: 'scale(0.9)' }
  });

  return transitions.map(({ item, key, props }) =>
    item ? (
      <animated.div key={key} style={props}>
        <ManualPayment paymentAddress={paymentAddress} paymentHash={paymentHash} priceInXem={priceInXem} />
      </animated.div>
    ) : (
      <animated.div key={key} style={props}>
        <div className={styles.qrcode}>
          <QRCode paymentAddress={paymentAddress.replace(/-/g, '')} price={priceInXem} idHash={paymentHash} />
        </div>
        <p className="text-center">
          Please scan the QR code with a NEM mobile wallet app to make your payment:{' '}
          <a href="https://itunes.apple.com/us/app/nem-wallet/id1227112677">
            <FontAwesome name="apple" className="mr-1" />
            iOS
          </a>{' '}
          and{' '}
          <a href="https://play.google.com/store/apps/details?id=org.nem.nac.mainnet&hl=en">
            <FontAwesome name="android" className="mr-1" />
            Android
          </a>
          .
        </p>
      </animated.div>
    )
  );
};

PaymentMethod.propTypes = {
  paymentAddress: PropTypes.string,
  paymentHash: PropTypes.string,
  priceInXem: PropTypes.string,
  showManualPayment: PropTypes.bool
};

export default PaymentMethod;
