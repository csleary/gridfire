import Button from 'components/button';
import PropTypes from 'prop-types';
import React from 'react';
import Spinner from 'components/spinner';
import classnames from 'classnames';
import styles from './selectCredits.module.css';

const SelectCredits = ({ productData = [], isLoading, sku, setSku, setStage, setShowPaymentModal }) => {
  const selectedProduct = productData.find(product => product.sku === sku) || {};
  const { label, priceUsd, priceXem } = selectedProduct;

  const handleClick = e => setSku(e.target.dataset.sku);

  return (
    <>
      <p>
        Help us cover our service costs by purchasing credits &mdash; cryptographic tokens issued on the NEM blockchain.
        Each token buys you the right to use nemp3 to sell your own music, and can be tranferred or sold at any point.
        So long as you hold the tokens at the address used by your nemp3 account, you can continue to use the service.
      </p>
      <p className={styles.mbAuto}>
        You will need one credit for every release you wish to sell. Select how many credits you wish to buy:
      </p>
      {isLoading ? (
        <Spinner wrapperClassName={styles.spinner} />
      ) : (
        <>
          <div className={styles.buttons}>
            {productData?.map(product => (
              <Button
                className={classnames(styles.button, { [styles.selected]: product.sku === sku })}
                data-sku={product.sku}
                disabled={isLoading}
                key={product.label}
                type="button"
                onClick={handleClick}
                tabIndex="0"
              >
                {`${product.label} ~$${product.priceUsd} USD`}
                {product.unitPrice.toString() !== product.priceUsd ? (
                  <div className={styles.unit}>${product.unitPrice} each</div>
                ) : null}
              </Button>
            ))}
          </div>
          <h3 className={styles.price}>
            {label} = <span className="yellow">~{priceXem?.toFixed(2)} XEM</span> (~$ {priceUsd} USD){' '}
          </h3>
        </>
      )}
      <p className={styles.mtAuto}>
        After your payment is confirmed, your nemp3 credits will be sent back to this same address.
      </p>
      <div className={styles.confirm}>
        <Button
          disabled={isLoading}
          onClick={() => setShowPaymentModal(false)}
          size="large"
          tabIndex="0"
          textLink
          type="button"
        >
          Cancel
        </Button>
        <Button
          disabled={isLoading}
          icon="chevron-right"
          iconRight
          onClick={() => setStage(2)}
          size="large"
          tabIndex="0"
          type="button"
        >
          Pay
        </Button>
      </div>
    </>
  );
};

SelectCredits.propTypes = {
  isLoading: PropTypes.bool,
  productData: PropTypes.array,
  sku: PropTypes.string,
  setSku: PropTypes.func,
  setStage: PropTypes.func,
  setShowPaymentModal: PropTypes.func
};

export default SelectCredits;
