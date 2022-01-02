import React, { useContext, useState } from 'react';
import { toastError, toastSuccess } from 'features/toast';
import Button from 'components/button';
import { Contract } from 'ethers';
import GridFirePayment from 'contracts/GridFirePayment.json';
import PropTypes from 'prop-types';
import { Web3Context } from 'index';
import axios from 'axios';
import classnames from 'classnames';
import { faCheckCircle } from '@fortawesome/free-solid-svg-icons';
import { faEthereum } from '@fortawesome/free-brands-svg-icons';
import { fetchUser } from 'features/user';
import styles from './purchaseButton.module.css';
import { useDispatch } from 'react-redux';

const { REACT_APP_CONTRACT_ADDRESS } = process.env;

const PurchaseButton = ({ inCollection, price, releaseId }) => {
  const provider = useContext(Web3Context);
  const dispatch = useDispatch();
  const [isPurchasing, setIsPurchasing] = useState(false);

  const handlePayment = async () => {
    const signer = provider.getSigner();
    const contract = new Contract(REACT_APP_CONTRACT_ADDRESS, GridFirePayment.abi, signer);

    try {
      setIsPurchasing(true);
      const res = await axios.get(`/api/release/purchase/${releaseId}`);
      const { release, paymentAddress } = res.data;

      const transactionReceipt = await contract.purchase(paymentAddress, release.price, {
        value: price
      });

      const confirmedTransaction = await transactionReceipt.wait(0);
      const { transactionHash } = confirmedTransaction;
      await axios.post(`/api/release/purchase/${releaseId}`, { transactionHash });
      dispatch(fetchUser());
      dispatch(toastSuccess('Purchased!'));
    } catch (error) {
      dispatch(toastError(error.response?.data?.error || error.message || error.toString()));
    } finally {
      setIsPurchasing(false);
    }
  };

  return (
    <div className="d-flex justify-content-center">
      <Button
        className={classnames(styles.buy, { [styles.disabled]: isPurchasing })}
        disabled={isPurchasing || inCollection}
        icon={inCollection ? faCheckCircle : faEthereum}
        onClick={handlePayment}
      >
        {!price ? 'Name Your Price' : inCollection ? 'Collection' : 'Purchase'}
      </Button>
    </div>
  );
};

PurchaseButton.propTypes = {
  inCollection: PropTypes.bool,
  price: PropTypes.number,
  releaseId: PropTypes.string
};

export default PurchaseButton;
