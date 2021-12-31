import { Contract, ethers } from 'ethers';
import React, { useContext, useEffect, useState } from 'react';
import { faCertificate, faCheck, faCheckCircle, faExclamationCircle, faMusic } from '@fortawesome/free-solid-svg-icons';
import { shallowEqual, useDispatch, useSelector } from 'react-redux';
import { toastError, toastInfo, toastSuccess } from 'features/toast';
import Button from 'components/button';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import GridFirePayment from 'contracts/GridFirePayment.json';
import Input from 'components/input';
import TextSpinner from 'components/textSpinner';
import { Web3Context } from 'index';
import { addPaymentAddress } from 'features/user';
import classnames from 'classnames';
import { fetchUserReleases } from 'features/releases';
import styles from './address.module.css';

const { REACT_APP_CONTRACT_ADDRESS } = process.env;

const Address = () => {
  const provider = useContext(Web3Context);
  const dispatch = useDispatch();
  const { paymentAddress } = useSelector(state => state.user, shallowEqual);
  const [balance, setBalance] = useState(ethers.utils.parseEther('0'));
  const [errors, setErrors] = useState({});
  const [isPristine, setIsPristine] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [values, setValues] = useState({ paymentAddress });
  const hasErrors = Object.values(errors).some(error => Boolean(error));
  const hasChanged = values.paymentAddress !== paymentAddress;
  const signer = provider.getSigner();
  const contract = new Contract(REACT_APP_CONTRACT_ADDRESS, GridFirePayment.abi, signer);

  useEffect(() => {
    dispatch(fetchUserReleases());
  }, []);

  useEffect(() => {
    contract.getBalance(paymentAddress).then(setBalance).catch(console.error);
  }, [paymentAddress]);

  const handleChange = e => {
    const { name, value } = e.target;
    setIsPristine(false);
    setErrors(({ [name]: error, ...rest }) => rest); // eslint-disable-line
    setValues(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setIsSubmitting(true);
    dispatch(addPaymentAddress(values)).then(() => setIsSubmitting(false));
  };

  const handleClaimBalance = async () => {
    try {
      const transactionReceipt = await contract.claim();
      const confirmedTransaction = await transactionReceipt.wait(0);
      const { transactionHash } = confirmedTransaction;
      contract.getBalance(paymentAddress).then(setBalance).catch(console.error);
      dispatch(toastSuccess('Claimed!'));
    } catch (error) {
      if (ethers.utils.formatEther(balance) === '0.0') {
        return void dispatch(toastInfo('Nothing to claim.'));
      }
      dispatch(toastError('Could not claim your balance'));
    }
  };

  return (
    <main className="container">
      <div className="row">
        <div className="col-lg mb-5">
          <h3 className="text-center mt-4">Payment Address</h3>
          <p className="text-center">
            Please add an ETH payment address if you wish to sell music. By default this is the address you used to sign
            in, but it can by any address or ENS domain.
          </p>
          <form className={`${styles.form} my-5 py-5`} onSubmit={handleSubmit}>
            <Input
              className={styles.address}
              disabled={isSubmitting}
              error={errors.paymentAddress}
              label={'Your ETH payment address'}
              name="paymentAddress"
              onChange={handleChange}
              placeholder="0x…"
              type="text"
              value={values.paymentAddress}
            />
            <div className="d-flex justify-content-end mb-5">
              <Button
                icon={faCheck}
                type="submit"
                disabled={Boolean(hasErrors) || !hasChanged || isPristine || isSubmitting}
              >
                Save Address
              </Button>
            </div>
            <p>
              Current GridFire balance at this address:{' '}
              {ethers.utils.formatEther(balance) === '0.0' ? '0' : ethers.utils.formatEther(balance)}
            </p>
            <Button disabled={ethers.utils.formatEther(balance) === '0.0'} type="button" onClick={handleClaimBalance}>
              Claim balance
            </Button>
          </form>
        </div>
      </div>
    </main>
  );
};

export default Address;
