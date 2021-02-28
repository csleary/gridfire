import { animated, config, useTransition } from 'react-spring';
import { shallowEqual, useSelector } from 'react-redux';
import DownloadButton from './downloadButton';
import React from 'react';
import Socket from './socket';
import Status from './status';
import Transactions from './transactions';
import styles from './payments.module.css';

const Payments = () => {
  const { isLoading, hasPurchased } = useSelector(state => state.payment, shallowEqual);

  const transition = useTransition(isLoading, {
    config: hasPurchased ? { ...config.stiff, clamp: true } : { ...config.slow, clamp: true },
    from: { opacity: 0, transform: 'translateY(-0.25rem) scale(0.98)' },
    enter: { opacity: 1, transform: 'translateY(0) scale(1.0)' },
    leave: { opacity: 0, transform: 'translateY(-0.25rem) scale(0.98)' }
  });

  return transition(
    (style, item) =>
      !item && (
        <animated.div className={styles.root} style={style}>
          <DownloadButton />
          <Socket />
          <Status />
          <Transactions />
        </animated.div>
      )
  );
};

export default Payments;
