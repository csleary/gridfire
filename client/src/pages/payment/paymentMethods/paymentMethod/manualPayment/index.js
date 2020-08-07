import React, { useState } from 'react';
import { animated, useTransition } from 'react-spring';
import Button from 'components/button';
import FontAwesome from 'react-fontawesome';
import PropTypes from 'prop-types';
import ReadOnlyTextarea from './readOnlyTextarea';
import styles from './manualPayment.module.css';

const ManualPayment = props => {
  const { paymentAddress, paymentHash, priceInXem } = props;
  const [step, setStep] = useState(0);

  const transitions = useTransition(step, null, {
    config: { mass: 1, tension: 250, friction: 30, easing: 'cubic-bezier(0.2, 0.8, 0.4, 1)' },
    from: { opacity: 0, position: 'absolute', left: '100%', right: '-100%', transform: 'scale(0.9)' },
    enter: { opacity: 1, left: '0', right: '0', transform: 'scale(1)' },
    leave: { opacity: 0, left: '-100%', right: '100%', transform: 'scale(0.9)' }
  });

  const copyPrice = parseFloat(priceInXem) ? (
    <>
      of <span className="yellow">{priceInXem} XEM</span>
    </>
  ) : (
    '(name your price!)'
  );

  const nextButton = (
    <Button
      className={styles.button}
      icon="chevron-right"
      iconClassName={styles.icon}
      iconRight
      textLink
      onClick={() => setStep(step + 1)}
    >
      Next Step
    </Button>
  );

  return transitions.map(({ item, key, props: style }) =>
    item % 3 === 0 ? (
      <animated.div className={styles.step} key={key} style={style}>
        <h4 className={styles.heading}>
          <span className="yellow">1.</span> Payment ID
        </h4>
        <p>
          Please remember to include the payment ID below in the &lsquo;message&rsquo; field when making your payment,
          as it&rsquo;s your unique, personalised purchase ID, used to confirm your purchase.
        </p>
        <ReadOnlyTextarea text={paymentHash} placeholder="Please log in to see your payment ID" />
        <p className={styles.note} role="alert">
          <FontAwesome name="exclamation-circle" className="mr-2" />
          Your payment ID is essential to your purchase. Please don&rsquo;t forget to include this.
        </p>
        {nextButton}
      </animated.div>
    ) : item % 3 === 1 ? (
      <animated.div className={styles.step} key={key} style={style}>
        <h4 className={styles.heading}>
          <span className="yellow">2.</span> Address
        </h4>
        <p>Add the payment address below:</p>
        <ReadOnlyTextarea text={paymentAddress} placeholder="Payment Address" />
        {nextButton}
      </animated.div>
    ) : item % 3 === 2 ? (
      <animated.div className={styles.step} key={key} style={style}>
        <h4 className={styles.heading}>
          <span className="yellow">3.</span> Amount
        </h4>
        <p>Fill in the payment amount {copyPrice} and hit send. Done! Wait for confirmation, and grab your download.</p>
        <ReadOnlyTextarea
          text={parseFloat(priceInXem) ? priceInXem : 'Name your price!'}
          placeholder="Payment Amount"
        />
        {nextButton}
      </animated.div>
    ) : null
  );
};

ManualPayment.propTypes = {
  paymentAddress: PropTypes.string,
  paymentHash: PropTypes.string,
  priceInXem: PropTypes.string
};

export default ManualPayment;
