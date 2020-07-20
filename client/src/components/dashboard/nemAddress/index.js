import { Field, formValueSelector, propTypes, reduxForm } from 'redux-form';
import React, { useEffect, useState } from 'react';
import { addNemAddress, fetchUserCredits } from 'features/user';
import { connect, shallowEqual, useDispatch, useSelector } from 'react-redux';
import { toastSuccess, toastWarning } from 'features/toast';
import FontAwesome from 'react-fontawesome';
import NemAddressFormField from './nemAddressFormField';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import { fetchUserReleases } from 'features/releases';
import nem from 'nem-sdk';
import styles from './nemAddress.module.css';
const addressPrefix = process.env.REACT_APP_NEM_NETWORK === 'mainnet' ? 'an \u2018N\u2019' : 'a \u2018T\u2019';

let NemAddress = props => {
  const [isCheckingCredits, setIsCheckingCredits] = useState(false);
  const dispatch = useDispatch();
  const { credits, nemAddress, nemAddressVerified } = useSelector(state => state.user, shallowEqual);
  const { userReleases } = useSelector(state => state.releases, shallowEqual);
  const { handleSubmit, invalid, nemAddressField, pristine, submitting } = props;

  useEffect(() => {
    if (nemAddress && nemAddressVerified) dispatch(fetchUserCredits());
    dispatch(fetchUserReleases());
  }, [dispatch, nemAddress, nemAddressVerified]);

  const onSubmit = async values => {
    await dispatch(addNemAddress(values));

    if (!values.nemAddress) {
      dispatch(toastWarning('NEM payment address removed.'));
    } else {
      dispatch(toastSuccess('NEM payment address saved.'));
    }
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
          <Field
            disabled={submitting}
            hint="This address has not yet been verified."
            id="signedMessage"
            label="Your Signed Message"
            name="signedMessage"
            nemAddress={nemAddress}
            nemAddressVerified={nemAddressVerified}
            placeholder={'{"message":"YOUR_MESSAGE","signer":"YOUR_PUBLIC_KEY","signature":"YOUR_SIGNATURE"}'}
            type="text"
            component={NemAddressFormField}
            validate={checkNemMessage}
          />
          <p>
            Please create a signed message in the desktop wallet app (Services &#8594; Signed message &#8594; Create a
            signed message), and copy/paste the results here to verify ownership of your account.
          </p>
          <p>
            It doesn&rsquo;t matter what you put in the message field, only that it is cryptographically signed by your
            private key.
          </p>
          <p>Once you have verified your account, you can add credit and start selling your music!</p>
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

  return (
    <main className="container">
      <div className="row">
        <div className="col-lg mb-5 py-3">
          <h3 className="text-center mt-4">NEM Payment Address</h3>
          <p className="text-center">
            Please add a NEM address if you wish to sell music, as fan payments and nemp3 credit will be sent directly
            to this address.
          </p>
          <form className={`${styles.form} my-5 py-5`} onSubmit={handleSubmit(onSubmit)}>
            <div className="form-row">
              <div className="col-md-9 mx-auto px-3">
                <Field
                  disabled={submitting}
                  format={address =>
                    address
                      ?.toUpperCase()
                      .replace(/-/g, '')
                      .match(/.{1,6}/g)
                      ?.join('-')
                  }
                  id="nemAddress"
                  hint="It doesn&rsquo;t matter whether you include dashes or not."
                  label="Your NEM Address"
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
                  <button
                    type="submit"
                    className="btn btn-outline-primary btn-lg"
                    disabled={(nemAddressField && invalid) || pristine || submitting}
                  >
                    {renderButtonLabel()}
                  </button>
                </div>
                <p>
                  <span className={creditClassName}>
                    <FontAwesome name="certificate" className="mr-1" />
                    Your credit balance is {credits}.
                  </span>
                  <button
                    className="btn btn-outline-primary btn-sm mx-2"
                    disabled={!nemAddress || !nemAddressVerified || isCheckingCredits}
                    onClick={handleUpdateCredits}
                    style={{ verticalAlign: 'bottom' }}
                    title={'Press to recheck your credit.'}
                    type="button"
                  >
                    <FontAwesome name="refresh" className="mr-2" spin={isCheckingCredits} />
                    Refresh
                  </button>
                </p>
                <p>
                  As you have {publishedReleaseCount ? publishedReleaseCount : 'no'} published release
                  {publishedReleaseCount === 1 ? '' : 's'}, you need to maintain a credit balance of at least{' '}
                  {publishedReleaseCount + 1} to be able to publish a new release or activate future powerups.
                </p>
                <p>
                  Need some credit? You&rsquo;ll be able to buy credit with XEM in the future, but for now{' '}
                  <a href="/contact">get in touch</a> and we&rsquo;ll send you a token for free.
                </p>
              </div>
            </div>
          </form>
          <h4>Getting Your First NEM Address</h4>
          <p>
            To receive payments from fans, as well as utility tokens or rewards from nemp3, you will need to have your
            own NEM address. The easiest way to do this is by setting up an account with one of the mobile wallets,
            which are available from your phone&rsquo;s respective download store, as linked from{' '}
            <a href="https://nem.io/downloads/">the NEM site</a>. Of course, there is a more fully-featured
            cross-platform desktop wallet also available.
          </p>
          <p>
            The mobile wallets are especially handy, as they are able to scan the QR codes on the payment pages using
            the device&rsquo;s camera, to fill in payment details automatically (which you can confirm before sending,
            naturally). This makes including the payment message code with your payment amount foolproof.
          </p>
          <p>
            Within any of the wallets, whether desktop or mobile, you can create any number of accounts, each with their
            own individual address. You could easily dedicate an address to nemp3, for instance.
          </p>
          <p>
            At present, only a single NEM address can be added to nemp3 accounts, so for example, automatic royalty
            splits are not yet possible (and would incur a network fee for royalties sent to each band member). This
            will change with the next update of the NEM infrastructure.
          </p>
        </div>
      </div>
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
