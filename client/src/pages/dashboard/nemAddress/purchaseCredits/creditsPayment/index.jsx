import React, { useEffect, useState } from 'react';
import { animated, useTransition } from 'react-spring';
import Button from 'components/button';
import FontAwesome from 'react-fontawesome';
import PropTypes from 'prop-types';
import QRCode from 'components/qrCode';
import ReadOnlyTextArea from 'components/readOnlyTextArea';
import Spinner from 'components/spinner';
import axios from 'axios';
import classnames from 'classnames';
import styles from './creditsPayment.module.css';
const explorer = process.env.REACT_APP_NEM_NETWORK === 'testnet' ? 'bob.nem.ninja:8765' : 'chain.nem.ninja';

const CreditsPayment = ({ paymentData, productData, sku, setPaymentData, setStage }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [showManualPayment, setshowManualPayment] = useState(false);
  const handleshowManualPayment = () => setshowManualPayment(!showManualPayment);

  useEffect(() => {
    if (!sku) return;
    setIsLoading(true);
    axios
      .post('/api/user/credits/buy', { sku })
      .then(res => setPaymentData(res.data))
      .finally(() => setIsLoading(false));
  }, [sku, setPaymentData]);

  const transitions = useTransition(showManualPayment, {
    config: { mass: 1, tension: 250, friction: 30, clamp: true },
    from: { opacity: 0, transform: 'scale(0.98)' },
    enter: { opacity: 1, transform: 'scale(1)' },
    leave: { opacity: 0, transform: 'scale(0.98)' }
  });

  const { PAYMENT_ADDRESS, paymentId, priceXem } = paymentData;
  const product = productData.find(el => el.sku === sku);
  const qrButton = classnames(styles.select, { [styles.selected]: !showManualPayment });
  const manualButton = classnames(styles.select, { [styles.selected]: showManualPayment });

  return (
    <>
      <div className={styles.buttons} role="group" aria-label="Payment Methods">
        <Button className={qrButton} disabled={isLoading} onClick={handleshowManualPayment} tabIndex="0" type="button">
          QR Scan
        </Button>
        <Button
          className={manualButton}
          disabled={isLoading}
          onClick={handleshowManualPayment}
          tabIndex="0"
          type="button"
        >
          Manual
        </Button>
      </div>
      {isLoading ? null : (
        <h4 className={styles.summary}>
          {product.label} = <span className="yellow">~{Number.parseFloat(priceXem).toFixed(2)} XEM</span> (~$
          {product.priceUsd} USD)
        </h4>
      )}
      <div className={styles.methods}>
        {transitions((style, item) =>
          item && !isLoading ? (
            <animated.div className={styles.wrapper} style={style}>
              <ReadOnlyTextArea
                label={
                  <a
                    href={`http://${explorer}/#/account/${PAYMENT_ADDRESS?.replace('-', '')}`}
                    rel="nofollow noopener noreferrer"
                    tabIndex="0"
                    target="_blank"
                    title="View this address on an explorer."
                  >
                    Payment address
                    <FontAwesome className={styles.icon} name="external-link" />
                  </a>
                }
                tabIndex="0"
                text={PAYMENT_ADDRESS?.toUpperCase()
                  .replace(/-/g, '')
                  .match(/.{1,6}/g)
                  ?.join('-')}
              />
              <ReadOnlyTextArea
                label={
                  <>
                    Payment message
                    <span className={styles.important}>
                      <FontAwesome className={styles.icon} name="exclamation-triangle" />
                      Important!
                    </span>
                  </>
                }
                tabIndex="0"
                text={paymentId}
              />
              <ReadOnlyTextArea label="Payment amount in XEM" text={priceXem?.toFixed(6)} tabIndex="0" />
              <span className={styles.remember}>Don&rsquo;t forget to include the message in your transaction.</span>
            </animated.div>
          ) : !isLoading ? (
            <animated.div className={styles.wrapper} style={style}>
              <div className={styles.qrCode}>
                <QRCode
                  bgColor="#17181c"
                  idHash={paymentId}
                  paymentAddress={PAYMENT_ADDRESS}
                  price={priceXem?.toFixed(6)}
                />
              </div>
              <p className="text-center">
                Please scan the QR code with a NEM mobile wallet app to make your payment:
                <br />
                <a href="https://itunes.apple.com/us/app/nem-wallet/id1227112677" tabIndex="0">
                  <FontAwesome name="apple" className="mr-1" />
                  iOS
                </a>{' '}
                and{' '}
                <a href="https://play.google.com/store/apps/details?id=org.nem.nac.mainnet&hl=en" tabIndex="0">
                  <FontAwesome name="android" className="mr-1" />
                  Android
                </a>
                .
              </p>
            </animated.div>
          ) : (
            <Spinner />
          )
        )}
      </div>
      <div className={styles.confirm}>
        <Button
          disabled={isLoading}
          icon="chevron-left"
          onClick={() => setStage(1)}
          size="large"
          tabIndex="0"
          type="button"
        >
          Back
        </Button>
        <Button
          disabled={isLoading}
          icon="chevron-right"
          iconRight
          onClick={() => setStage(3)}
          size="large"
          tabIndex="0"
          type="button"
        >
          Confirm
        </Button>
      </div>
    </>
  );
};

CreditsPayment.propTypes = {
  paymentData: PropTypes.object,
  productData: PropTypes.array,
  sku: PropTypes.string,
  setPaymentData: PropTypes.func,
  setStage: PropTypes.func
};

export default CreditsPayment;
