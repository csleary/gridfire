import React, { useEffect, useState } from 'react';
import { addNemAddress, fetchUserCredits } from 'features/user';
import { faCertificate, faCheck, faCheckCircle, faExclamationCircle, faMusic } from '@fortawesome/free-solid-svg-icons';
import { shallowEqual, useDispatch, useSelector } from 'react-redux';
import Button from 'components/button';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import Input from 'components/input';
import Modal from 'components/modal';
import PurchaseCredits from './purchaseCredits';
import ReadOnlyTextArea from 'components/readOnlyTextArea';
import TextSpinner from 'components/textSpinner';
import classnames from 'classnames';
import { fetchUserReleases } from 'features/releases';
import nem from 'nem-sdk';
import styles from './nemAddress.module.css';
const addressPrefix = process.env.REACT_APP_NEM_NETWORK === 'mainnet' ? 'an \u2018N\u2019' : 'a \u2018T\u2019';

const formatAddress = address =>
  address
    .toUpperCase()
    .replace(/-/g, '')
    .match(/.{1,6}/g)
    ?.join('-') || '';

const NemAddress = () => {
  const dispatch = useDispatch();
  const { userReleases } = useSelector(state => state.releases, shallowEqual);
  const { credits, nemAddress, nemAddressChallenge, nemAddressVerified } = useSelector(
    state => state.user,
    shallowEqual
  );
  const [errors, setErrors] = useState({});
  const [isCheckingCredits, setIsCheckingCredits] = useState(false);
  const [isPristine, setIsPristine] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [values, setValues] = useState({ nemAddress: '' });
  const hasErrors = Object.values(errors).some(error => Boolean(error));
  const hasChanged = values.nemAddress !== nemAddress || values.signedMessage;

  useEffect(() => {
    if (nemAddress) setValues({ nemAddress });
  }, [nemAddress]);

  useEffect(() => {
    dispatch(fetchUserReleases());
  }, []);

  useEffect(() => {
    if (nemAddress && nemAddressVerified) dispatch(fetchUserCredits());
  }, [nemAddress, nemAddressVerified]);

  const handleChange = e => {
    const { name, value } = e.target;
    setIsPristine(false);

    setErrors(prev => {
      if (prev[name]) {
        const next = { ...prev };
        delete next[name];
        return next;
      }

      return prev;
    });

    if (name === 'nemAddress') {
      return setValues(prev => ({ ...prev, [name]: value.replace(/-/g, '') }));
    }

    setValues(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = e => {
    e.preventDefault();
    const validationErrors = validate(values);

    if (Object.values(validationErrors).some(error => Boolean(error))) {
      return setErrors(validationErrors);
    }

    setIsSubmitting(true);
    dispatch(addNemAddress({ ...values, nemAddressChallenge })).finally(() => {
      setIsSubmitting(false);
      setValues(prev => ({ ...prev, signedMessage: '' }));
    });
  };

  const handleUpdateCredits = () => {
    setIsCheckingCredits(true);
    dispatch(fetchUserCredits()).then(() => setIsCheckingCredits(false));
  };

  const publishedReleaseCount = userReleases?.filter(release => release.published === true).length || 0;

  return (
    <main className="container">
      <div className="row">
        <div className="col-lg mb-5">
          <h3 className="text-center mt-4">NEM Payment Address</h3>
          <p className="text-center">
            Please add a NEM address if you wish to sell music. You do not need to enter an address if you only plan on
            purchasing music, as payments are made directly from your account to the artist&rsquo;s account.
          </p>
          <form className={`${styles.form} my-5 py-5`} onSubmit={handleSubmit}>
            <Input
              className={styles.address}
              disabled={isSubmitting}
              error={errors.nemAddress}
              hint="It doesn&rsquo;t matter whether you include dashes or not."
              label={
                <>
                  <label htmlFor="nemAddress">Your NEM address</label>
                  {nemAddress && !nemAddressVerified ? (
                    <span className={styles.unconfirmed} title="Please sign a message to verify your address.">
                      Unverified
                      <FontAwesomeIcon icon={faExclamationCircle} className="ml-2" />
                    </span>
                  ) : nemAddress && nemAddressVerified ? (
                    <span className={styles.confirmed} title="Thank you for verifying your address.">
                      Verified
                      <FontAwesomeIcon icon={faCheckCircle} className="ml-2" />
                    </span>
                  ) : null}
                </>
              }
              name="nemAddress"
              onChange={handleChange}
              placeholder={`NEM Address (should start with ${addressPrefix})`}
              type="text"
              value={formatAddress(values.nemAddress)}
            />
            {nemAddress && !nemAddressVerified ? (
              <>
                <ReadOnlyTextArea label={'Verification message to be signed'} text={nemAddressChallenge} />
                <Input
                  disabled={isSubmitting}
                  element="textarea"
                  hint="This address has not yet been verified."
                  label="Your signed message"
                  name="signedMessage"
                  onChange={handleChange}
                  placeholder={
                    '{ "message": <YOUR_MESSAGE>, "signer": <YOUR_PUBLIC_KEY>, "signature": <YOUR_SIGNATURE> }'
                  }
                  type="text"
                  value={values.signedMessage || ''}
                />
                <p>
                  Please copy the verification phrase and create a signed message with it using the desktop wallet app
                  (Services &#8594; Signed message &#8594; Create a signed message). Then copy/paste the results here to
                  verify ownership of your account.
                </p>
                <p>Then you&rsquo;re all set to add credit and start selling your music!</p>
              </>
            ) : null}
            <div className="d-flex justify-content-end mb-5">
              <Button
                icon={faCheck}
                type="submit"
                disabled={Boolean(hasErrors) || !hasChanged || isPristine || isSubmitting}
              >
                {
                  nemAddress && values.nemAddress && !nemAddressVerified
                    ? 'Verify Address'
                    : nemAddress && !values.nemAddress
                    ? 'Remove Address' // eslint-disable-line
                    : 'Save Address' // eslint-disable-line
                }
              </Button>
            </div>
            <div className="mb-1">
              <span className={classnames({ red: !credits, green: credits })}>
                <FontAwesomeIcon icon={faCertificate} className="mr-2" />
                {
                  nemAddressVerified && credits
                    ? `Your nemp3 credits balance: ${credits}`
                    : nemAddressVerified
                    ? 'You don\u2019t currently have any credits.' // eslint-disable-line
                    : 'Please add a verified NEM address to update your credits balance.' // eslint-disable-line
                }
              </span>
              <Button
                className={styles.update}
                disabled={!nemAddress || !nemAddressVerified || isCheckingCredits}
                onClick={handleUpdateCredits}
                textLink
                title={'Press to recheck your credit.'}
                type="button"
              >
                <TextSpinner isActive={isCheckingCredits} type="nemp3" speed={0.01} className={styles.spinner} />
                Update
              </Button>
            </div>
            <div
              className={classnames('mb-3', {
                yellow: !publishedReleaseCount,
                red: credits < publishedReleaseCount,
                green: publishedReleaseCount && credits >= publishedReleaseCount
              })}
            >
              <FontAwesomeIcon icon={faMusic} className="mr-2" />
              {`Published releases: ${publishedReleaseCount}`}
            </div>
            <p>
              As you have {publishedReleaseCount ? publishedReleaseCount : 'no'} published release
              {publishedReleaseCount === 1 ? '' : 's'}, you need to maintain a credit balance of at least{' '}
              {publishedReleaseCount + 1} to be able to publish a new release or activate future powerups.
            </p>
            <div className={styles.buy}>
              <Button
                className={styles.buyButton}
                icon={faCertificate}
                onClick={() => setShowPaymentModal(true)}
                type="button"
              >
                Buy Credits
              </Button>
            </div>
          </form>
          <h4>Getting Your First NEM Address</h4>
          <p>
            To make payments and receive credits or rewards from nemp3, you will need your own NEM address. Mobile
            wallets are available for iOS and android, allowing you to easily make payments by scanning a QR code, as
            well as a more fully-featured desktop wallet for Mac/PC, allowing you to create and explore namespaces and
            mosaics, sign messages, earn/harvest XEM, and more. Please visit{' '}
            <a href="https://nem.io/downloads/">the NEM site</a> to download a wallet for your preferred platform.
          </p>
        </div>
      </div>
      <Modal closeModal={() => setShowPaymentModal(false)} isOpen={showPaymentModal} showClose={false}>
        <PurchaseCredits setShowPaymentModal={setShowPaymentModal} />
      </Modal>
    </main>
  );
};

const checkNemAddress = nemAddress => {
  if (nemAddress && !nem.model.address.isValid(nemAddress)) {
    return 'This doesn\u2019t appear to be a valid NEM address. Please double-check it!';
  }
};

const checkNemMessage = signedMessage => {
  if (!signedMessage) {
    return 'Please paste your message in to verify your NEM address.';
  }
};

const validate = values => {
  const errors = {};
  errors.nemAddress = checkNemAddress(values.nemAddress);
  if (values.signedMessage) errors.signedMessage = checkNemMessage(values.signedMessage);
  return errors;
};

export default NemAddress;
