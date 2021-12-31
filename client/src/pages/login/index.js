import React, { useContext, useState } from 'react';
import { shallowEqual, useDispatch, useSelector } from 'react-redux';
import { toastError, toastSuccess } from 'features/toast';
import Button from 'components/button';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Web3Context } from 'index';
import axios from 'axios';
import classNames from 'classnames';
import { faEthereum } from '@fortawesome/free-brands-svg-icons';
import { setAccount } from 'features/web3';
import styles from './login.module.css';
import { updateUser } from 'features/user';
import { useNavigate } from 'react-router-dom';

const Login = () => {
  const provider = useContext(Web3Context);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { account, isConnected } = useSelector(state => state.web3, shallowEqual);
  const [errors, setErrors] = useState({});

  const getNonce = async () => {
    const res = await axios.get('api/auth/web3');
    const { nonce } = res.data;
    return nonce;
  };

  const checkMessage = async ({ address, message, signature }) => {
    const res = await axios.post('api/auth/web3', { address, message, signature });
    const { user } = res.data;
    return user;
  };

  const signInWithWeb3 = async (address = account) => {
    try {
      const signer = provider.getSigner();
      const nonce = await getNonce();
      const message = `Hi! Welcome to GridFire.
      
      Using your Ether wallet you can safely and securely sign in, without needing an email or password. 'Signing' a message proves you are the owner of the account. This is a free process, costing you no ether, and doesn't require access to the blockchain.
      
      We've included a unique, randomly-generated code to ensure that your signature is recent: ${nonce
        .match(/.{1,8}/g)
        .join('-')}.`;

      const signature = await signer.signMessage(message);
      const user = await checkMessage({ address, message, signature });
      dispatch(updateUser(user));
      dispatch(toastSuccess('You are now logged in with your Ether wallet.'));
      navigate('/');
    } catch (error) {
      if (error.code === 4001) {
        return void dispatch(toastError(error.message));
      }

      dispatch(toastError(error.toString()));
    }
  };

  const handleWeb3Login = async () => {
    try {
      if (isConnected) {
        await signInWithWeb3();
      } else {
        const accounts = await provider.send('eth_requestAccounts', []);
        const [firstAccount] = accounts || [];
        dispatch(setAccount(firstAccount));
        await signInWithWeb3(firstAccount);
      }
    } catch (error) {
      if (error.code === 4001) {
        return void dispatch(toastError(`${error.message} Please connect to be able to sign in and use the site.`));
      }

      dispatch(toastError(error.toString()));
    }
  };

  return (
    <main className="container">
      <div className="row">
        <div className="col py-3">
          <h2 className="text-center mt-4">Log In</h2>
        </div>
      </div>
      <div className="row">
        <div className={classNames(styles.oauth, 'col-md')}>
          <div className={styles.service}>
            <FontAwesomeIcon className={styles.icon} icon={faEthereum} />
            <Button className={styles.button} onClick={handleWeb3Login}>
              Log in with your Ethereum wallet
            </Button>
          </div>
        </div>
      </div>
    </main>
  );
};

export default Login;
