import { Field, formValueSelector, propTypes, reduxForm } from 'redux-form';
import React, { useEffect, useState } from 'react';
import { addNemAddress, fetchUserCredits } from 'features/user';
import { connect, shallowEqual, useDispatch, useSelector } from 'react-redux';
import Button from 'components/button';
import FontAwesome from 'react-fontawesome';
import Modal from 'components/modal';
import NemAddressFormField from './nemAddressFormField';
import PropTypes from 'prop-types';
import PurchaseCredits from './purchaseCredits';
import ReadOnlyTextArea from 'components/readOnlyTextArea';
import classnames from 'classnames';
import { fetchUserReleases } from 'features/releases';
import nem from 'nem-sdk';
import styles from './nemAddress.module.css';
const addressPrefix = process.env.REACT_APP_NEM_NETWORK === 'mainnet' ? 'an \u2018N\u2019' : 'a \u2018T\u2019';

let NemAddress = props => {
  const [isCheckingCredits, setIsCheckingCredits] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const dispatch = useDispatch();
  const { credits, nemAddress, nemAddressChallenge, nemAddressVerified } = useSelector(
    state => state.user,
    shallowEqual
  );
  const { userReleases } = useSelector(state => state.releases, shallowEqual);
  const { handleSubmit, invalid, nemAddressField, pristine, submitting } = props;

  useEffect(() => {
    if (nemAddress && nemAddressVerified) dispatch(fetchUserCredits());
    dispatch(fetchUserReleases());
  }, [dispatch, nemAddress, nemAddressVerified]);

  const onSubmit = async values => {
    await dispatch(addNemAddress({ ...values, nemAddressChallenge }));
  };

  const handleUpdateCredits = async () => {
    setIsCheckingCredits(true);
    await dispatch(fetchUserCredits());
    setIsCheckingCredits(false);
  };

  const renderVerifyAddressField = () => {
    if (nemAddress && nemAddressField && !nemAddressVerified) {
      return (
        <>
          <ReadOnlyTextArea label={'Verification message to be signed'} text={nemAddressChallenge} />
          <Field
            disabled={submitting}
            hint="This address has not yet been verified."
            id="signedMessage"
            label="Your signed message"
            name="signedMessage"
            nemAddress={nemAddress}
            nemAddressVerified={nemAddressVerified}
            placeholder={'{ "message": <YOUR_MESSAGE>, "signer": <YOUR_PUBLIC_KEY>, "signature": <YOUR_SIGNATURE> }'}
            type="text"
            component={NemAddressFormField}
            validate={checkNemMessage}
          />
          <p>
            Please copy the verification phrase and create a signed message with it using the desktop wallet app
            (Services &#8594; Signed message &#8594; Create a signed message). Then copy/paste the results here to
            verify ownership of your account.
          </p>
          <p>Then you&rsquo;re all set to add credit and start selling your music!</p>
        </>
      );
    }
  };

  const renderButtonLabel = () => {
    if (nemAddress && nemAddressField && !nemAddressVerified) return 'Verify Address';
    if (nemAddress && !nemAddressField) return 'Remove Address';
    return 'Save Address';
  };

  const publishedReleaseCount = userReleases?.filter(release => release.published === true).length ?? 0;
  const creditClassName = classnames({ red: !credits, green: credits });

  const releaseCountClassName = classnames('mb-3', {
    yellow: !publishedReleaseCount,
    red: credits < publishedReleaseCount,
    green: publishedReleaseCount && credits >= publishedReleaseCount
  });

  return (
    <main className="container">
      <div className="row">
        <div className="col-lg mb-5">
          <h3 className="text-center mt-4">NEM Payment Address</h3>
          <p className="text-center">
            Please add a NEM address if you wish to sell music. You do not need to enter an address if you only plan on
            purchasing music, as payments are made directly from your account to the artist&rsquo;s account.
          </p>
          <form className={`${styles.form} my-5 py-5`} onSubmit={handleSubmit(onSubmit)}>
            <Field
              disabled={submitting}
              format={address =>
                address?.length
                  ? address
                      ?.toUpperCase()
                      .replace(/-/g, '')
                      .match(/.{1,6}/g)
                      ?.join('-')
                  : ''
              }
              id="nemAddress"
              hint="It doesn&rsquo;t matter whether you include dashes or not."
              label="Your NEM address"
              name="nemAddress"
              nemAddress={nemAddress}
              nemAddressVerified={nemAddressVerified}
              placeholder={`NEM Address (should start with ${addressPrefix})`}
              type="text"
              component={NemAddressFormField}
              validate={checkNemAddress}
            />
            {renderVerifyAddressField()}
            <div className="d-flex justify-content-end mb-5">
              <Button icon="check" type="submit" disabled={(nemAddressField && invalid) || pristine || submitting}>
                {renderButtonLabel()}
              </Button>
            </div>
            <div className="mb-1">
              <span className={creditClassName}>
                <FontAwesome name="certificate" className="mr-2" />
                {nemAddressVerified && credits
                  ? `Your nemp3 credits balance: ${credits}`
                  : nemAddressVerified
                  ? 'You don\u2019t currently have any credits.'
                  : 'Please add a verified NEM address to update your credits balance.'}
              </span>
              <Button
                className={styles.update}
                disabled={!nemAddress || !nemAddressVerified || isCheckingCredits}
                icon="refresh"
                onClick={handleUpdateCredits}
                spin={isCheckingCredits}
                textLink
                title={'Press to recheck your credit.'}
                type="button"
              >
                Update
              </Button>
            </div>
            <div className={releaseCountClassName}>
              <FontAwesome name="music" className="mr-2" />
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
                icon="certificate"
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

const checkNemAddress = address => {
  if (address && !nem.model.address.isValid(address)) {
    return 'This doesn\u2019t appear to be a valid NEM address. Please double-check it!';
  }
  return undefined;
};

const checkNemMessage = message => {
  if (!message) {
    return 'Please paste your message in to verify your NEM address.';
  }
  return undefined;
};

NemAddress.propTypes = {
  ...propTypes,
  nemAddressField: PropTypes.string
};

const fieldSelector = formValueSelector('nemAddressForm');

function mapStateToProps(state) {
  return {
    initialValues: state.user,
    nemAddressField: fieldSelector(state, 'nemAddress')
  };
}

NemAddress = reduxForm({
  enableReinitialize: true,
  form: 'nemAddressForm'
})(NemAddress);

NemAddress = connect(mapStateToProps)(NemAddress);
export default NemAddress;
